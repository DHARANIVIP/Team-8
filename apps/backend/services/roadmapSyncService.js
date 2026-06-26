import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { getCached, setCached } from '../middleware/roadmapCache.js';

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Setup Gemini Client
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Standardize prompt querying for structured JSON data.
 */
async function generateJSON(prompt, systemInstruction) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const modelsToTry = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-pro',
    'gemini-1.0-pro'
  ];
  let lastError;

  for (const modelName of modelsToTry) {
    try {
      console.log(`🤖 Roadmap Generator: Querying model: "${modelName}"...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      console.warn(`⚠️ Roadmap Generator: Model "${modelName}" failed. Error:`, error.message || error);
      lastError = error;
    }
  }

  throw lastError;
}

/**
 * Seed or retrieve a learning roadmap by career category
 */
async function fetchDetailedRoadmapFromDb(roadmapRow) {
  try {
    const { data: nodes } = await supabase
      .from('roadmap_nodes')
      .select('*')
      .eq('roadmap_id', roadmapRow.id)
      .order('sequence_order', { ascending: true });

    if (nodes && nodes.length > 0) {
      const nodeIds = nodes.map(n => n.id);
      const { data: resources } = await supabase
        .from('roadmap_resources')
        .select('*')
        .in('node_id', nodeIds);

      const nodesWithResources = nodes.map(node => ({
        ...node,
        resources: (resources || []).filter(r => r.node_id === node.id)
      }));

      return {
        ...roadmapRow,
        nodes: nodesWithResources
      };
    }
  } catch (err) {
    console.warn('⚠️ Error fetching nodes from DB details:', err.message);
  }

  return {
    ...roadmapRow,
    nodes: []
  };
}

export async function syncFromRoadmapSh(slug) {
  const cacheKey = `roadmap:${slug}`;
  const cachedData = getCached(cacheKey);
  if (cachedData) {
    console.log(`⚡ Cache HIT for roadmap.sh ${slug}`);
    return cachedData;
  }

  const url = `https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/${slug}/${slug}.json`;

  let dbRoadmap = null;
  try {
    const { data } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('name', slug === 'frontend' ? 'Frontend Developer' : 'Backend Developer')
      .maybeSingle();
    dbRoadmap = data;
  } catch (err) {
    console.warn(`⚠️ DB lookup for ${slug} failed, might be missing columns:`, err.message);
  }

  try {
    let headers = {};
    if (dbRoadmap && dbRoadmap.etag) {
      headers['If-None-Match'] = dbRoadmap.etag;
    }

    let response;
    let isNotModified = false;
    try {
      response = await axios.get(url, { headers, timeout: 6000 });
    } catch (err) {
      if (err.response && err.response.status === 304) {
        isNotModified = true;
      } else {
        throw err;
      }
    }

    let roadmapObj;

    if (isNotModified && dbRoadmap) {
      roadmapObj = await fetchDetailedRoadmapFromDb(dbRoadmap);
    } else {
      const gitHubData = response.data;
      const newEtag = response.headers.etag;

      const nodes = gitHubData.nodes || [];
      const edges = gitHubData.edges || [];

      const childToParentMap = new Map();
      for (const edge of edges) {
        childToParentMap.set(edge.target, edge.source);
      }

      const topicNodes = nodes.filter(n => n.type === 'topic' || n.type === 'subtopic' || n.type === 'milestone');

      const name = slug === 'frontend' ? 'Frontend Developer' : 'Backend Developer';
      const category = slug === 'frontend' ? 'Frontend' : 'Backend';
      const description = slug === 'frontend'
        ? 'Master HTML, CSS, JavaScript, React, and modern frontend tools from the official roadmap.sh learning path.'
        : 'Design databases, microservices, REST APIs, and server architectures from the official roadmap.sh learning path.';

      try {
        let roadmapId;
        const roadmapPayload = {
          name,
          category,
          description,
          difficulty_level: slug === 'frontend' ? 'Beginner' : 'Intermediate',
          estimated_duration: slug === 'frontend' ? '6 Months' : '8 Months',
          source: 'roadmap.sh',
          source_slug: slug,
          etag: newEtag || null,
          last_sync: new Date().toISOString()
        };

        if (dbRoadmap) {
          const { data: updatedRoadmap, error: updateError } = await supabase
            .from('roadmaps')
            .update(roadmapPayload)
            .eq('id', dbRoadmap.id)
            .select()
            .single();
          if (updateError) throw updateError;
          roadmapId = updatedRoadmap.id;
        } else {
          const { data: newRoadmap, error: insertError } = await supabase
            .from('roadmaps')
            .insert([roadmapPayload])
            .select()
            .single();
          if (insertError) throw insertError;
          roadmapId = newRoadmap.id;
        }

        // Delete old nodes and resources
        await supabase.from('roadmap_nodes').delete().eq('roadmap_id', roadmapId);

        const parentsList = topicNodes.filter(n => !childToParentMap.has(n.id) || !topicNodes.some(p => p.id === childToParentMap.get(n.id)));
        const childrenList = topicNodes.filter(n => childToParentMap.has(n.id) && topicNodes.some(p => p.id === childToParentMap.get(n.id)));

        const sourceIdToDbId = new Map();
        let seq = 1;

        // Insert parents
        for (const parent of parentsList) {
          const { data: insertedParent, error: pErr } = await supabase
            .from('roadmap_nodes')
            .insert([{
              roadmap_id: roadmapId,
              title: parent.data?.label || parent.id,
              description: `Master the concepts of ${parent.data?.label || parent.id}.`,
              sequence_order: seq++,
              node_type: 'topic',
              source_node_id: parent.id
            }])
            .select()
            .single();

          if (pErr) throw pErr;
          sourceIdToDbId.set(parent.id, insertedParent.id);

          await supabase.from('roadmap_resources').insert([{
            node_id: insertedParent.id,
            title: `Official roadmap.sh Guide: ${parent.data?.label || parent.id}`,
            url: `https://roadmap.sh/${slug}#${parent.id}`,
            resource_type: 'Link'
          }]);
        }

        // Insert children
        for (const child of childrenList) {
          const parentSourceId = childToParentMap.get(child.id);
          const parentDbId = sourceIdToDbId.get(parentSourceId);

          const { data: insertedChild, error: cErr } = await supabase
            .from('roadmap_nodes')
            .insert([{
              roadmap_id: roadmapId,
              title: child.data?.label || child.id,
              description: `Learn ${child.data?.label || child.id} as part of the ${parentSourceId} milestone.`,
              sequence_order: seq++,
              node_type: 'subtopic',
              parent_node_id: parentDbId || null,
              source_node_id: child.id
            }])
            .select()
            .single();

          if (cErr) throw cErr;
          sourceIdToDbId.set(child.id, insertedChild.id);

          await supabase.from('roadmap_resources').insert([{
            node_id: insertedChild.id,
            title: `Official roadmap.sh Guide: ${child.data?.label || child.id}`,
            url: `https://roadmap.sh/${slug}#${child.id}`,
            resource_type: 'Link'
          }]);
        }

        const finalRoadmap = await supabase.from('roadmaps').select('*').eq('id', roadmapId).single();
        roadmapObj = await fetchDetailedRoadmapFromDb(finalRoadmap.data);

      } catch (saveError) {
        console.warn('⚠️ Supabase sync saving failed (possibly missing columns). Returning in-memory structures...', saveError.message);
        
        let seq = 1;
        const inMemoryNodes = topicNodes.map((node) => {
          const parentSourceId = childToParentMap.get(node.id);
          const isChild = childToParentMap.has(node.id) && topicNodes.some(p => p.id === parentSourceId);
          return {
            id: `mock-node-${node.id}`,
            title: node.data?.label || node.id,
            description: isChild 
              ? `Learn ${node.data?.label || node.id} as part of the ${parentSourceId} milestone.`
              : `Master the concepts of ${node.data?.label || node.id}.`,
            sequence_order: seq++,
            node_type: isChild ? 'subtopic' : 'topic',
            source_node_id: node.id,
            parent_node_id: isChild ? `mock-node-${parentSourceId}` : null,
            resources: [{
              id: `mock-res-${node.id}`,
              title: `Official roadmap.sh Guide: ${node.data?.label || node.id}`,
              url: `https://roadmap.sh/${slug}#${node.id}`,
              resource_type: 'Link'
            }]
          };
        });

        roadmapObj = {
          id: `mock-roadmap-${slug}`,
          name,
          category,
          description,
          difficulty_level: slug === 'frontend' ? 'Beginner' : 'Intermediate',
          estimated_duration: slug === 'frontend' ? '6 Months' : '8 Months',
          source: 'roadmap.sh',
          source_slug: slug,
          nodes: inMemoryNodes
        };
      }
    }

    setCached(cacheKey, roadmapObj);
    return roadmapObj;

  } catch (err) {
    console.error(`❌ Complete failure syncing from roadmap.sh for ${slug}:`, err.message);
    if (dbRoadmap) {
      console.log('Serving fallback stale DB cache...');
      return fetchDetailedRoadmapFromDb(dbRoadmap);
    }
    return getFallbackRoadmap(slug === 'frontend' ? 'Frontend Developer' : 'Backend Developer', slug === 'frontend' ? 'Frontend' : 'Backend');
  }
}

/**
 * Seed or retrieve a learning roadmap by career category
 */
export async function getOrGenerateRoadmap(roadmapName, category) {
  const lowerName = roadmapName.toLowerCase();
  
  // Resolve standard names for DB matching
  let dbSearchName = roadmapName;
  if (lowerName.includes('frontend')) {
    dbSearchName = 'Frontend Developer';
  } else if (lowerName.includes('backend')) {
    dbSearchName = 'Backend Developer';
  }

  try {
    // 1. Try fetching from database first
    const { data: cachedRoadmap } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('name', dbSearchName)
      .maybeSingle();

    if (cachedRoadmap) {
      // Fetch associated nodes and resources
      const { data: nodes } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', cachedRoadmap.id)
        .order('sequence_order', { ascending: true });

      if (nodes && nodes.length > 0) {
        const nodeIds = nodes.map(n => n.id);
        const { data: resources } = await supabase
          .from('roadmap_resources')
          .select('*')
          .in('node_id', nodeIds);

        // Map resources back to their nodes
        const nodesWithResources = nodes.map(node => ({
          ...node,
          resources: (resources || []).filter(r => r.node_id === node.id)
        }));

        return {
          ...cachedRoadmap,
          nodes: nodesWithResources
        };
      }
    }
  } catch (dbError) {
    console.warn('⚠️ Supabase roadmap cache lookup failed. Querying Gemini fallback...', dbError.message);
  }

  // 2. Cache miss or table missing: Query Gemini to build roadmap
  console.log(`🔄 Generating fresh learning roadmap for "${roadmapName}" in category "${category}"...`);
  
  const systemInstruction = 'You are a Senior curriculum engineer and roadmap architect. You design comprehensive, highly structured developer learning paths. Return only valid JSON.';
  const prompt = `Design a step-by-step developer learning roadmap for: "${roadmapName}" (Category: "${category}").
  Return a JSON object conforming exactly to this structure:
  {
    "name": "${roadmapName}",
    "category": "${category}",
    "description": "Short description of what a developer learns along this path",
    "difficulty_level": "Beginner, Intermediate, or Advanced",
    "estimated_duration": "Estimated time (e.g. '6 Months' or '9 Months')",
    "nodes": [
      {
        "title": "Title of the step (e.g. 'HTML & CSS Basics', 'RESTful APIs', 'Docker')",
        "description": "Short overview of what to study and master in this step",
        "sequence_order": 1, // integer starting from 1
        "resources": [
          {
            "title": "Clear resource title (e.g. 'MDN Web Docs: HTML', 'Traversy Media: Git Crash Course')",
            "url": "A real, standard high-quality URL (e.g. MDN docs, Coursera search, or general tutorials)",
            "resource_type": "Article, Video, or Course"
          }
        ]
      }
    ]
  }
  Provide exactly 5 to 8 sequence nodes representing a high-level learning timeline. Make sure resource URLs are real and valid.`;

  let roadmapData;
  try {
    roadmapData = await generateJSON(prompt, systemInstruction);
  } catch (error) {
    console.error('❌ Failed to generate roadmap via Gemini. Serving default backup...', error.message);
    roadmapData = getFallbackRoadmap(roadmapName, category);
  }

  // 3. Attempt to save the generated roadmap to the database cache
  try {
    // Delete existing metadata if any to prevent collision
    await supabase.from('roadmaps').delete().eq('name', roadmapData.name);

    const { data: newRoadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .insert([{
        name: roadmapData.name,
        category: roadmapData.category,
        description: roadmapData.description,
        difficulty_level: roadmapData.difficulty_level,
        estimated_duration: roadmapData.estimated_duration,
        last_sync: new Date().toISOString()
      }])
      .select()
      .single();

    if (roadmapError) throw roadmapError;

    const insertedNodes = [];
    for (const node of roadmapData.nodes) {
      const { data: newNode, error: nodeError } = await supabase
        .from('roadmap_nodes')
        .insert([{
          roadmap_id: newRoadmap.id,
          title: node.title,
          description: node.description,
          sequence_order: node.sequence_order
        }])
        .select()
        .single();

      if (nodeError) throw nodeError;

      const nodeResources = [];
      if (node.resources && node.resources.length > 0) {
        for (const res of node.resources) {
          const { data: newRes } = await supabase
            .from('roadmap_resources')
            .insert([{
              node_id: newNode.id,
              title: res.title,
              url: res.url,
              resource_type: res.resource_type
            }])
            .select()
            .single();
          if (newRes) nodeResources.push(newRes);
        }
      }

      insertedNodes.push({
        ...newNode,
        resources: nodeResources
      });
    }

    return {
      ...newRoadmap,
      nodes: insertedNodes
    };

  } catch (saveError) {
    console.warn('⚠️ Database migration columns missing or down. Serving roadmap in-memory...', saveError.message);
    // Return the formatted roadmap in-memory so the app never crashes
    return {
      id: 'mock-roadmap-id-' + category.toLowerCase(),
      name: roadmapData.name,
      category: roadmapData.category,
      description: roadmapData.description,
      difficulty_level: roadmapData.difficulty_level,
      estimated_duration: roadmapData.estimated_duration,
      nodes: roadmapData.nodes.map((node, i) => ({
        id: `mock-node-id-${i}`,
        title: node.title,
        description: node.description,
        sequence_order: node.sequence_order,
        resources: (node.resources || []).map((res, j) => ({
          id: `mock-res-id-${i}-${j}`,
          title: res.title,
          url: res.url,
          resource_type: res.resource_type
        }))
      }))
    };
  }
}

/**
 * Fallback static roadmaps in case Gemini API is completely unavailable
 */
function getFallbackRoadmap(name, category) {
  return {
    name: name,
    category: category,
    description: `Complete curriculum mapping for mastering ${name} engineering pathways.`,
    difficulty_level: 'Intermediate',
    estimated_duration: '6 Months',
    nodes: [
      {
        title: 'Core Fundamentals',
        description: 'Understand the building blocks, operational protocols, and syntax constructs.',
        sequence_order: 1,
        resources: [
          { title: 'MDN Web Basics', url: 'https://developer.mozilla.org/en-US/docs/Learn', resource_type: 'Article' },
          { title: 'W3Schools Reference', url: 'https://www.w3schools.com', resource_type: 'Article' }
        ]
      },
      {
        title: 'Version Control Systems',
        description: 'Learn Git branching models, staging index, conflict resolution, and remote hosting.',
        sequence_order: 2,
        resources: [
          { title: 'Git Pro Book', url: 'https://git-scm.com/book/en/v2', resource_type: 'Course' },
          { title: 'Git Branching Game', url: 'https://learngitbranching.js.org/', resource_type: 'Video' }
        ]
      },
      {
        title: 'Design Architectures & Frameworks',
        description: 'Explore design paradigms, structured state management, and modern component frameworks.',
        sequence_order: 3,
        resources: [
          { title: 'Architectural Patterns', url: 'https://patterns.dev', resource_type: 'Article' }
        ]
      }
    ]
  };
}

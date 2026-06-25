import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

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
export async function getOrGenerateRoadmap(roadmapName, category) {
  try {
    // 1. Try fetching from database first
    const { data: cachedRoadmap } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('name', roadmapName)
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

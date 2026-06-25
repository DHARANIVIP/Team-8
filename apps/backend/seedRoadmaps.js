import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const roadmapsData = [
  {
    name: 'Frontend Developer',
    category: 'Frontend',
    description: 'Master HTML, CSS, JavaScript, React, and modern frontend tools from the official learning path.',
    difficulty_level: 'Beginner',
    estimated_duration: '6 Months',
    source: 'roadmap.sh',
    source_slug: 'frontend',
    topics: [
      {
        title: '1. Internet Fundamentals',
        description: 'Understand how the internet operates, HTTP protocols, DNS configurations, web servers, and browser rendering engines.',
        subtopics: [
          { title: 'How does the internet work?', description: 'Study packet switching, routers, IPs, and global network infrastructure.', url: 'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work' },
          { title: 'What is HTTP?', description: 'Understand request/response headers, status codes, REST paradigms, and HTTPS.', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP' },
          { title: 'DNS & Domains', description: 'Learn how Domain Name Servers resolve hosts to IP addresses.', url: 'https://www.cloudflare.com/learning/dns/what-is-dns/' },
          { title: 'Browsers & Web Hosting', description: 'Explore rendering engines, DOM trees, and server deployments.', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work' }
        ]
      },
      {
        title: '2. HTML & Semantic Web',
        description: 'Learn layout structures, writing accessible semantic tags, forms validations, and basic search engine optimization.',
        subtopics: [
          { title: 'HTML Basics', description: 'Master basic elements, attributes, headings, lists, and layout structures.', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
          { title: 'Semantic HTML', description: 'Use semantic tags like main, header, section, and article for structural meaning.', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Semantics#semantics_in_html' },
          { title: 'Forms & Validations', description: 'Design inputs, forms fields, custom errors, and client-side validations.', url: 'https://developer.mozilla.org/en-US/docs/Learn/Forms' },
          { title: 'Web Accessibility (a11y) & SEO', description: 'Implement ARIA attributes, image alts, and tags to rank in search results.', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility' }
        ]
      },
      {
        title: '3. CSS & Responsive Design',
        description: 'Master CSS styling rules, grid/flexbox layouts, responsive design, media queries, and modern CSS preprocessors.',
        subtopics: [
          { title: 'CSS Basics & Layouts', description: 'Learn CSS selectors, specificity, cascading rule, Flexbox, and CSS Grid.', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
          { title: 'Responsive Design & Media Queries', description: 'Build layouts that scale perfectly on mobile, tablet, and desktop monitors.', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design' },
          { title: 'Tailwind CSS & CSS Preprocessors', description: 'Study utility-first styling with Tailwind, Sass, and PostCSS.', url: 'https://tailwindcss.com/docs/installation' }
        ]
      },
      {
        title: '4. JavaScript Programming',
        description: 'Learn script execution, DOM manipulation, asynchronous programming with Fetch/Ajax, and modern ES6+ structures.',
        subtopics: [
          { title: 'JavaScript Syntax & DOM', description: 'Variables, loops, functions, objects, array methods, and event handling.', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
          { title: 'Fetch API & Asynchronous JS', description: 'Understand Promises, async/await, and fetching data from API endpoints.', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' }
        ]
      },
      {
        title: '5. VCS, Hosting & Package Managers',
        description: 'Use Git for version control, host code on GitHub, and manage package dependencies using npm, yarn, or pnpm.',
        subtopics: [
          { title: 'Git & VCS Hosting', description: 'Learn branching, commits, merging, pull requests, and pushing to GitHub.', url: 'https://git-scm.com/doc' },
          { title: 'Dependency Package Managers', description: 'Understand package.json, npm commands, pnpm speed, and yarn locks.', url: 'https://docs.npmjs.com/' }
        ]
      },
      {
        title: '6. Component Frameworks (React)',
        description: 'Pick React as your core framework to build component-based reusable UI states, hooks, and single-page applications.',
        subtopics: [
          { title: 'React Hooks & State', description: 'Master components, props, state, useEffect, and custom hooks.', url: 'https://react.dev/reference/react' },
          { title: 'Routing & State Management', description: 'Use react-router, Redux Toolkit, or Zustand to manage global states.', url: 'https://reactrouter.com/' }
        ]
      },
      {
        title: '7. Build Tools & Testing',
        description: 'Configure Vite module bundler, implement code formatting with Prettier/ESLint, and write Vitest/Cypress test pipelines.',
        subtopics: [
          { title: 'Vite & Bundlers', description: 'Set up dev compilation pipelines, code splitting, and building for production.', url: 'https://vite.dev/guide/' },
          { title: 'ESLint & Prettier', description: 'Automate code style linters and syntax rules checking on file saves.', url: 'https://eslint.org/' },
          { title: 'Vitest, Jest & Cypress', description: 'Write unit tests with Vitest, and end-to-end integration tests using Cypress.', url: 'https://vitest.dev/' }
        ]
      },
      {
        title: '8. Security & SSR (Next.js)',
        description: 'Implement secure web habits, study CORS rules, and build server-side rendered (SSR) apps using Next.js.',
        subtopics: [
          { title: 'Web Security Basics', description: 'Understand CORS, HTTPS certificates, content security policies (CSP), and OWASP vulnerabilities.', url: 'https://developer.mozilla.org/en-US/docs/Web/Security' },
          { title: 'Next.js (React Server Components)', description: 'Master routing, SSR, static site generation, and server actions.', url: 'https://nextjs.org/docs' }
        ]
      }
    ]
  },
  {
    name: 'Backend Developer',
    category: 'Backend',
    description: 'Design databases, microservices, REST APIs, web security protocols, server caches, and deployment infrastructure.',
    difficulty_level: 'Intermediate',
    estimated_duration: '8 Months',
    source: 'roadmap.sh',
    source_slug: 'backend',
    topics: [
      {
        title: '1. Internet & Server Concepts',
        description: 'Understand network communication, client-server models, HTTP protocol structures, and browser interaction mechanisms.',
        subtopics: [
          { title: 'Network Routing & HTTP', description: 'Learn headers, request methods, status codes, socket handshakes, and SSL protocols.', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP' },
          { title: 'Browsers & IP resolution', description: 'DNS servers mapping, domain registration, and hosting environments.', url: 'https://www.cloudflare.com/learning/dns/what-is-dns/' }
        ]
      },
      {
        title: '2. Server-side Language (JavaScript / Python)',
        description: 'Pick Node.js (JavaScript) or Python to write backend runtime script code, server processes, and operational controllers.',
        subtopics: [
          { title: 'Node.js & Express.js', description: 'Understand event loops, asynchronous FS operations, Express routing, and npm configurations.', url: 'https://nodejs.org/docs/latest/api/' },
          { title: 'Python Django & FastAPI', description: 'Write fast python routing controllers, middleware handling, and data models.', url: 'https://fastapi.tiangolo.com/' }
        ]
      },
      {
        title: '3. Relational Databases (PostgreSQL)',
        description: 'Design structured relational tables, primary/foreign keys, database normalization, complex SQL joins, and transaction boundaries.',
        subtopics: [
          { title: 'PostgreSQL & SQL Schema', description: 'Write structured SQL queries, data migrations, and schema architectures.', url: 'https://www.postgresql.org/docs/' },
          { title: 'ORMs & ACID Transactions', description: 'Use Prisma/Sequelize to query DB, understand Isolation, Durability, and transaction rollbacks.', url: 'https://prisma.io' }
        ]
      },
      {
        title: '4. NoSQL Databases (MongoDB & Redis)',
        description: 'Implement document-based databases for flexible models, key-value stores for rapid querying, and in-memory caches.',
        subtopics: [
          { title: 'MongoDB Atlas document store', description: 'Define mongoose schemas, subdocuments, aggregation pipelines, and indices.', url: 'https://www.mongodb.com/docs/' },
          { title: 'Redis Caching Service', description: 'Speed up API responses by saving hot data keys directly in Redis memory.', url: 'https://redis.io/docs/' }
        ]
      },
      {
        title: '5. API Design & Patterns',
        description: 'Build robust REST APIs, define OpenAPI specs, query data efficiently with GraphQL, or use gRPC for microservices communication.',
        subtopics: [
          { title: 'RESTful API Standards', description: 'Design clean route URLs, query string params, correct HTTP verb usage, and JSON responses.', url: 'https://restfulapi.net/' },
          { title: 'GraphQL & gRPC architectures', description: 'Query client-specific fields, implement schemas, and compile fast protobuf protocols.', url: 'https://graphql.org/' }
        ]
      },
      {
        title: '6. Web Security & Hashing',
        description: 'Secure application endpoints with HTTPS, CORS filters, OAuth/JWT authorization, and securely hash passwords with bcrypt.',
        subtopics: [
          { title: 'JWT & OAuth Authentication', description: 'Generate signed payload tokens, refresh strategies, and integrate Google/GitHub logins.', url: 'https://jwt.io/introduction' },
          { title: 'Bcrypt Password Hashing', description: 'Secure user login accounts by salting and hashing password strings before storing.', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Salt' }
        ]
      },
      {
        title: '7. Testing & CI/CD Pipelines',
        description: 'Write Jest or Mocha test suites for controllers, mock databases, and automate deployment workflows.',
        subtopics: [
          { title: 'Jest Unit & Integration Testing', description: 'Mock network requests, assert API route response codes, and test helper utility files.', url: 'https://jestjs.io/' },
          { title: 'GitHub Actions CI/CD', description: 'Automate build compiles, linter runs, testing suites, and remote hosting deployments.', url: 'https://docs.github.com/en/actions' }
        ]
      },
      {
        title: '8. Containerization & DevOps (Docker)',
        description: 'Pack application dependencies inside lightweight Docker images, scale containers, and configure Nginx proxy routing.',
        subtopics: [
          { title: 'Docker Containers', description: 'Write Dockerfiles, build images, run docker-compose environments, and volume mount assets.', url: 'https://docs.docker.com/' },
          { title: 'Nginx Reverse Proxy & Load Balancer', description: 'Route public traffic safely to backend ports, configure server headers, and SSL certificates.', url: 'https://nginx.org/en/docs/' }
        ]
      }
    ]
  },
  {
    name: 'DevOps Engineer',
    category: 'DevOps',
    description: 'Understand system administration, containerization, CI/CD orchestration, monitoring, and cloud infrastructures.',
    difficulty_level: 'Advanced',
    estimated_duration: '9 Months',
    source: 'gemini',
    source_slug: 'devops',
    topics: [
      {
        title: '1. Linux & OS Basics',
        description: 'Master operating systems concepts, terminal navigation, shell scripting, permissions, and service controls.',
        subtopics: [
          { title: 'Shell Scripting & Bash', description: 'Write automation scripts, handle environment variables, streams and redirects.', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Bash' },
          { title: 'OS Administration', description: 'Configure file systems, manage systemd processes, check memory loads, and run top/htop utility monitors.', url: 'https://git-scm.com/book/en/v2' }
        ]
      },
      {
        title: '2. Networking & Web Security',
        description: 'Study essential internet protocols, port forwarding, secure tunnels, domain name configuration, and proxy structures.',
        subtopics: [
          { title: 'DNS & HTTP/S Routing', description: 'Understand TLS certificates, reverse proxies, port redirection, and load balancing routers.', url: 'https://www.cloudflare.com/learning/dns/what-is-dns/' },
          { title: 'SSH & Firewalls', description: 'Generate public/private keys, configure firewalls (ufw/iptables), and control network access lists.', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP' }
        ]
      },
      {
        title: '3. Containerization (Docker)',
        description: 'Understand application packing, isolated namespace environments, image optimization, and local volume mounting.',
        subtopics: [
          { title: 'Dockerfiles & Images', description: 'Write optimized Dockerfiles, use multi-stage builds, and manage images.', url: 'https://docs.docker.com/' },
          { title: 'Docker Compose Orchestration', description: 'Run multi-container application stacks locally using simple docker-compose configurations.', url: 'https://docs.docker.com/compose/' }
        ]
      },
      {
        title: '4. CI/CD Pipelines',
        description: 'Automate static code testing, dependency building, compiler checks, and code pushes to staging or production systems.',
        subtopics: [
          { title: 'GitHub Actions workflow', description: 'Write custom YAML files to trigger build compiles and run automated test suites on push hooks.', url: 'https://docs.github.com/en/actions' },
          { title: 'Jenkins Server automation', description: 'Define build stages, credentials configuration, and webhook triggers on build nodes.', url: 'https://www.jenkins.io/doc/' }
        ]
      },
      {
        title: '5. Infrastructure as Code (IaC)',
        description: 'Model infrastructure resources declaratively using version-controlled script code to avoid manual clicks.',
        subtopics: [
          { title: 'Terraform Resource Provisioning', description: 'Write HCL scripts to build cloud networks, instances, and firewall rules.', url: 'https://registry.terraform.io/' },
          { title: 'Ansible Configuration management', description: 'Write playbooks to update libraries, install software packages, and configure remote servers.', url: 'https://docs.ansible.com/' }
        ]
      },
      {
        title: '6. Kubernetes Orchestration',
        description: 'Manage automated load-balanced clusters, handle self-healing containers, service routing, and configuration maps.',
        subtopics: [
          { title: 'K8s Cluster Resources (Pods & Deployments)', description: 'Understand pods, replica sets, YAML specs, services routing, and configs.', url: 'https://kubernetes.io/docs/home/' },
          { title: 'Helm Charts templating', description: 'Package Kubernetes resources using templates, variables, and standard version releases.', url: 'https://helm.sh/docs/' }
        ]
      },
      {
        title: '7. Observability & Logging',
        description: 'Gather metrics, monitor system performance, inspect application health endpoints, and aggregate distributed logs.',
        subtopics: [
          { title: 'Prometheus & Grafana Monitoring', description: 'Define metrics scrapers, save time-series databases, and build dashboards.', url: 'https://prometheus.io/docs/introduction/overview/' },
          { title: 'ELK Stack Log Aggregation', description: 'Collect server logs via Logstash/Fluentd and index them inside Elasticsearch for Kibana querying.', url: 'https://www.elastic.co/guide/index.html' }
        ]
      }
    ]
  },
  {
    name: 'AI/ML Specialist',
    category: 'AI/ML',
    description: 'Learn linear algebra, probability, Python data analysis, classical machine learning algorithms, deep learning models, and model deployment.',
    difficulty_level: 'Advanced',
    estimated_duration: '12 Months',
    source: 'gemini',
    source_slug: 'ai-ml',
    topics: [
      {
        title: '1. Mathematics & Statistics Basics',
        description: 'Understand linear algebra, vector multiplication, gradient descent calculus, probability rules, and statistical distributions.',
        subtopics: [
          { title: 'Linear Algebra & Calculus', description: 'Master matrices, eigenvectors, matrix dot products, partial derivatives, and optimization calculus.', url: 'https://khanacademy.org' },
          { title: 'Probability & Distributions', description: 'Study Bayes theorem, normal distributions, confidence intervals, and hypothesis testing.', url: 'https://khanacademy.org' }
        ]
      },
      {
        title: '2. Python Core Data Analysis',
        description: 'Write Python programs, perform data cleaning with Pandas, optimize math matrices with NumPy, and plot data charts.',
        subtopics: [
          { title: 'NumPy & Pandas', description: 'Perform array slicing, vector calculations, load CSVs, clean missing values, and group data.', url: 'https://numpy.org/doc/' },
          { title: 'Matplotlib & Seaborn plots', description: 'Build scatter plots, histograms, heatmaps, and correlation charts to analyze variables.', url: 'https://pandas.pydata.org/docs/' }
        ]
      },
      {
        title: '3. Classical Machine Learning',
        description: 'Implement regression models, classification trees, random forests, clustering techniques, and Scikit-Learn libraries.',
        subtopics: [
          { title: 'Supervised Learning algorithms', description: 'Write linear/logistic regression, SVMs, decision trees, random forests, and gradient boosting.', url: 'https://scikit-learn.org/stable/' },
          { title: 'Unsupervised Learning & PCA', description: 'Implement K-Means clustering, hierarchical clustering, and PCA dimension reduction.', url: 'https://scikit-learn.org/stable/' }
        ]
      },
      {
        title: '4. Deep Learning & Neural Networks',
        description: 'Understand forward propagation, activation functions, backpropagation, CNNs, and PyTorch syntax.',
        subtopics: [
          { title: 'Neural Networks & Activation Functions', description: 'Study dense layers, backprop weights updates, ReLU, Sigmoid, and loss functions.', url: 'https://pytorch.org/docs/stable/index.html' },
          { title: 'Convolutional Networks (CNN)', description: 'Master kernel filters, pooling layers, feature extractions, and image class predictions.', url: 'https://pytorch.org/docs/stable/index.html' }
        ]
      },
      {
        title: '5. Natural Language Processing (NLP)',
        description: 'Learn word tokenization, TF-IDF vectors, word embeddings, LSTM recurrent models, and Transformer architectures.',
        subtopics: [
          { title: 'Tokenization & Embeddings', description: 'Clean string datasets, use Word2Vec embeddings, and map words to vector arrays.', url: 'https://www.nltk.org/' },
          { title: 'Transformers & LLM Foundations', description: 'Understand self-attention mechanisms, encoder-decoder blocks, and pre-trained HuggingFace models.', url: 'https://huggingface.co/docs' }
        ]
      },
      {
        title: '6. Computer Vision basics',
        description: 'Manipulate image files, extract edges using filters, locate object bounding boxes, and implement OpenCV routines.',
        subtopics: [
          { title: 'OpenCV & Image processing', description: 'Read pixel channels, apply blur filters, scale frames, and extract contours.', url: 'https://docs.opencv.org/' },
          { title: 'Object Detection & YOLO', description: 'Understand anchoring boxes, non-max suppression, and real-time YOLO object coordinates extraction.', url: 'https://pytorch.org/docs/stable/index.html' }
        ]
      },
      {
        title: '7. MLOps & Model Deployment',
        description: 'Deploy machine learning models as web APIs, track experiments with MLflow, and package pipelines inside Docker containers.',
        subtopics: [
          { title: 'FastAPI Model Serving', description: 'Write backend routes to receive JSON arrays, pass them to a loaded model object, and return predictions.', url: 'https://fastapi.tiangolo.com/' },
          { title: 'MLflow Experiment tracking', description: 'Log parameters, check loss metric plots, and save serial model artifacts (.pkl/.onnx).', url: 'https://mlflow.org/docs/latest/index.html' }
        ]
      }
    ]
  },
  {
    name: 'Claude Code Developer',
    category: 'AI Tools',
    description: 'Master CLI-based AI coding workflows, agentic commands execution, terminal-based code generation, and sandboxing protections.',
    difficulty_level: 'Intermediate',
    estimated_duration: '3 Months',
    source: 'gemini',
    source_slug: 'claude-code',
    topics: [
      {
        title: '1. CLI & Terminal Operations',
        description: 'Get comfortable with command-line interactions, environment configuration, and shell scripts automation.',
        subtopics: [
          { title: 'Terminal Navigation', description: 'Master file manipulations, directory trees, pipe flows, and package installations.', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Bash' },
          { title: 'SSH & Environment Variables', description: 'Configure secure connections, set tokens, and setup profiles.', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP' }
        ]
      },
      {
        title: '2. Claude Code CLI Basics',
        description: 'Install and initialize the Claude Code utility, authorize session keys, and run basic commands.',
        subtopics: [
          { title: 'Installation & Authentication', description: 'Get started with npm installation, setting API keys, and authorizing tokens.', url: 'https://docs.anthropic.com/en/docs/welcome' },
          { title: 'Core CLI Commands', description: 'Run basic queries, view available flags, analyze file tokens, and write scripts.', url: 'https://docs.anthropic.com/en/docs/welcome' }
        ]
      },
      {
        title: '3. Agentic Command Execution',
        description: 'Understand agentic code updates, file system reads/writes, terminal commands execution, and interactive loops.',
        subtopics: [
          { title: 'Agent Context Management', description: 'Feed relevant files, restrict paths, and design clear instructions for file updates.', url: 'https://docs.anthropic.com/en/docs/welcome' },
          { title: 'Prompt engineering patterns', description: 'Structure system rules, design task plans, and write custom commands for clean completions.', url: 'https://docs.anthropic.com/en/docs/welcome' }
        ]
      },
      {
        title: '4. Integrated Refactoring & Fixes',
        description: 'Use the CLI to automatically detect errors, apply design patterns, and write unit testing flows.',
        subtopics: [
          { title: 'Debugging with Claude Code', description: 'Pass stack trace log errors, let the agent search files, and apply correct syntax bugfixes.', url: 'https://docs.anthropic.com/en/docs/welcome' },
          { title: 'Automating Unit Tests', description: 'Instruct the agent to write test assertions and execute tests inside the CLI.', url: 'https://docs.anthropic.com/en/docs/welcome' }
        ]
      },
      {
        title: '5. Security & Permission Sandboxing',
        description: 'Setup system write barriers, path overrides, prompt security rules, and key restrictions.',
        subtopics: [
          { title: 'Write Protections & Restrictions', description: 'Enable file access locks, whitelist directories, and configure sandbox execution.', url: 'https://docs.anthropic.com/en/docs/welcome' }
        ]
      }
    ]
  },
  {
    name: 'Vibe Coding Specialist',
    category: 'AI Tools',
    description: 'Leverage generative AI to quickly scaffold web applications, debug features, iterate styling, and verify deployments.',
    difficulty_level: 'Beginner',
    estimated_duration: '2 Months',
    source: 'gemini',
    source_slug: 'vibe-coding',
    topics: [
      {
        title: '1. AI-Assisted Prompt Engineering',
        description: 'Master prompting methodologies, zero-shot and few-shot formatting, system system instructions, and markdown specifications.',
        subtopics: [
          { title: 'Structuring System Prompts', description: 'Define role criteria, boundaries, rules, and layout structures for LLMs.', url: 'https://docs.anthropic.com/en/docs/welcome' },
          { title: 'Few-Shot & Multi-Turn formatting', description: 'Give mock examples, feed history logs, and direct conversations for optimized outputs.', url: 'https://docs.anthropic.com/en/docs/welcome' }
        ]
      },
      {
        title: '2. Interactive App Scaffolding',
        description: 'Create website prototypes, mock database schemas, and clean frontend components using simple prompts.',
        subtopics: [
          { title: 'Scaffolding skeletal structures', description: 'Write prompts to compile file indexes, basic HTML grids, and skeleton styles.', url: 'https://docs.anthropic.com/en/docs/welcome' },
          { title: 'Mock data integration', description: 'Provide dummy JSON schemas, mock fetch functions, and API placeholders.', url: 'https://docs.anthropic.com/en/docs/welcome' }
        ]
      },
      {
        title: '3. Debugging with AI Agents',
        description: 'Feed runtime compile errors, browser console logs, and backend stacks to obtain swift, correct patches.',
        subtopics: [
          { title: 'Error log diagnostics', description: 'Inspect error stack messages, analyze lines of code, and apply corrective edits.', url: 'https://docs.anthropic.com/en/docs/welcome' }
        ]
      },
      {
        title: '4. Continuous Iterative Generation',
        description: 'Perform code refinement, swap design tokens, add styling adjustments, and add responsive blocks.',
        subtopics: [
          { title: 'Code Refinements & Styling', description: 'Update color palettes, add border radius, adjust font typography, and design grids with AI guidance.', url: 'https://docs.anthropic.com/en/docs/welcome' }
        ]
      },
      {
        title: '5. Deployment & Vibe Check',
        description: 'Deploy the coded application, verify routing links, run manual browser assertions, and ensure the code is production-ready.',
        subtopics: [
          { title: 'Static hosting & Vercel builds', description: 'Hook Git repository to Vercel/Netlify for immediate previews and check deployment builds.', url: 'https://docs.anthropic.com/en/docs/welcome' },
          { title: 'Manual verification flows', description: 'Click interactive page tabs, test checklists, check mobile dimensions, and verify server responses.', url: 'https://docs.anthropic.com/en/docs/welcome' }
        ]
      }
    ]
  }
];

export async function seedRoadmaps() {
  console.log('🏁 Starting PostgreSQL Roadmap seeding...');
  
  // Verify table existence first to prevent ugly uncaught exceptions
  try {
    const { error: checkError } = await supabase
      .from('roadmaps')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.message.includes('relation "public.roadmaps" does not exist')) {
      console.warn('\n⚠️  [PostgreSQL Seeder] Database tables are missing! Please run the SQL queries in apps/backend/database.sql in your Supabase SQL Editor to create the tables.');
      return;
    }
  } catch (err) {
    console.warn('\n⚠️  [PostgreSQL Seeder] Could not check table existence:', err.message);
  }

  let targetRoadmaps = roadmapsData;
  try {
    const { data: existingRoadmaps } = await supabase
      .from('roadmaps')
      .select('name');
    
    if (existingRoadmaps && existingRoadmaps.length > 0) {
      const existingNames = existingRoadmaps.map(r => r.name);
      targetRoadmaps = roadmapsData.filter(map => !existingNames.includes(map.name));
      
      if (targetRoadmaps.length === 0) {
        console.log('✅ PostgreSQL Roadmaps are already fully seeded. Skipping seeder to make startup instant.');
        return;
      } else {
        console.log(`🔄 Found ${existingNames.length} roadmaps in DB. Seeding only the ${targetRoadmaps.length} missing roadmaps...`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not compare existing roadmaps. Seeding all paths:', err.message);
  }

  for (const mapData of targetRoadmaps) {
    console.log(`\n--------------------------------------------`);
    console.log(`⚙️ Seeding Roadmap: "${mapData.name}"...`);

    try {
      // 1. Delete existing matching roadmap to allow clean re-runs
      const { data: existingMap } = await supabase
        .from('roadmaps')
        .select('id')
        .eq('name', mapData.name)
        .maybeSingle();

      if (existingMap) {
        console.log(`♻️ Found existing roadmap with ID: ${existingMap.id}. Deleting for clean rebuild...`);
        const { error: delErr } = await supabase
          .from('roadmaps')
          .delete()
          .eq('id', existingMap.id);
        if (delErr) throw delErr;
      }

      // 2. Insert main roadmap metadata
      const { data: newMap, error: mapErr } = await supabase
        .from('roadmaps')
        .insert([{
          name: mapData.name,
          category: mapData.category,
          description: mapData.description,
          difficulty_level: mapData.difficulty_level,
          estimated_duration: mapData.estimated_duration,
          source: mapData.source,
          source_slug: mapData.source_slug,
          last_sync: new Date().toISOString()
        }])
        .select()
        .single();

      if (mapErr) throw mapErr;
      console.log(`✅ Saved Roadmap Meta. Generated ID: ${newMap.id}`);

      let seq = 1;

      // 3. Loop through topics (parent nodes)
      for (const t of mapData.topics) {
        const { data: parentNode, error: pErr } = await supabase
          .from('roadmap_nodes')
          .insert([{
            roadmap_id: newMap.id,
            title: t.title,
            description: t.description,
            sequence_order: seq++,
            node_type: 'topic'
          }])
          .select()
          .single();

        if (pErr) throw pErr;
        console.log(`  🔹 Saved Topic: "${t.title}"`);

        // 4. Loop through subtopics (child nodes linked to parent)
        for (const st of t.subtopics) {
          const { data: childNode, error: cErr } = await supabase
            .from('roadmap_nodes')
            .insert([{
              roadmap_id: newMap.id,
              title: st.title,
              description: st.description,
              sequence_order: seq++,
              node_type: 'subtopic',
              parent_node_id: parentNode.id
            }])
            .select()
            .single();

          if (cErr) throw cErr;

          // 5. Insert resource link for the child node
          const { error: resErr } = await supabase
            .from('roadmap_resources')
            .insert([{
              node_id: childNode.id,
              title: `MDN/Cloudflare Guide: ${st.title}`,
              url: st.url,
              resource_type: st.url.includes('youtube') || st.url.includes('video') ? 'Video' : 'Article'
            }]);

          if (resErr) throw resErr;
        }
        console.log(`    🔸 Saved ${t.subtopics.length} Subtopics.`);
      }

      console.log(`✨ Successfully seeded "${mapData.name}"!`);
    } catch (err) {
      console.error(`❌ Failed to seed "${mapData.name}":`, err.message);
    }
  }

  console.log(`\n🎉 Seeding process finished.`);
}

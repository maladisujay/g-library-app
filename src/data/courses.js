// Programmes offered and their curriculum (odd semester of the academic year).
export const PROGRAMS = {
  CSE: { code: 'CSE', name: 'B.Tech Computer Science and Engineering', short: 'B.Tech CSE', school: 'School of Technology' },
  AIML: { code: 'AIML', name: 'B.Tech CSE (Artificial Intelligence and Machine Learning)', short: 'B.Tech CSE (AI&ML)', school: 'School of Technology' },
  ECE: { code: 'ECE', name: 'B.Tech Electronics and Communication Engineering', short: 'B.Tech ECE', school: 'School of Technology' },
  ME: { code: 'ME', name: 'B.Tech Mechanical Engineering', short: 'B.Tech Mech', school: 'School of Technology' },
  CE: { code: 'CE', name: 'B.Tech Civil Engineering', short: 'B.Tech Civil', school: 'School of Technology' },
  BBA: { code: 'BBA', name: 'Bachelor of Business Administration', short: 'BBA', school: 'School of Business' },
};

// [code, title, credits, textbooks, references, units]
const C = (code, title, credits, textbooks, references, units) => ({
  code, title, credits, textbooks, references,
  units: units.map((u, i) => {
    const [name, topics] = u.split(':');
    return { no: i + 1, title: name.trim(), topics: (topics || '').trim() };
  }),
});

export const COURSES = [
  // Common first year
  C('MATH1001', 'Calculus and Linear Algebra', 4, ['B001'], ['B002'], [
    'Matrices: rank, eigenvalues, Cayley-Hamilton theorem', 'Differential calculus: mean value theorems, Taylor series', 'Multivariable calculus: partial derivatives, maxima and minima', 'Integral calculus: double and triple integrals', 'Ordinary differential equations: first and higher order']),
  C('PHYS1001', 'Engineering Physics', 3, ['B003'], [], [
    'Wave optics: interference, diffraction', 'Lasers and optical fibres', 'Quantum mechanics: Schrodinger equation', 'Semiconductor physics: band theory', 'Magnetic and dielectric materials']),
  C('CSEN1001', 'Problem Solving and Programming in C', 4, ['B004', 'B005'], ['B006'], [
    'Algorithms, flowcharts and C basics', 'Control structures and loops', 'Arrays, strings and functions', 'Pointers and dynamic memory', 'Structures, unions and file handling']),
  C('MECH1001', 'Engineering Graphics', 2, ['B007'], [], [
    'Lettering, dimensioning and scales', 'Orthographic projections of points and lines', 'Projections of planes and solids', 'Sections and development of surfaces', 'Isometric projections']),
  C('ENGL1001', 'Communicative English', 2, ['B008'], [], [
    'Vocabulary building and word formation', 'Reading comprehension', 'Technical writing and reports', 'Presentation skills', 'Group discussion and interviews']),
  C('BBA1001', 'Business Economics', 4, ['B086'], [], [
    'Demand and supply analysis', 'Elasticity and consumer behaviour', 'Production and cost', 'Market structures', 'National income and inflation']),
  C('BBA1011', 'Financial Accounting', 4, ['B083'], [], [
    'Accounting concepts and conventions', 'Journal, ledger and trial balance', 'Final accounts of sole proprietors', 'Depreciation accounting', 'Introduction to company accounts']),

  // Second year
  C('MATH2001', 'Probability and Statistics', 4, ['B009'], ['B001'], [
    'Probability and Bayes theorem', 'Random variables and distributions', 'Sampling distributions', 'Testing of hypothesis', 'Correlation and regression']),
  C('CSEN2001', 'Data Structures', 4, ['B010'], ['B011'], [
    'Arrays, stacks and queues', 'Linked lists', 'Trees and binary search trees', 'Graphs and traversals', 'Sorting, searching and hashing']),
  C('CSEN2011', 'Discrete Mathematical Structures', 3, ['B012'], [], [
    'Mathematical logic and proofs', 'Sets, relations and functions', 'Combinatorics and recurrence relations', 'Graph theory', 'Algebraic structures']),
  C('CSEN2021', 'Object Oriented Programming with Java', 4, ['B013'], ['B014'], [
    'Classes, objects and constructors', 'Inheritance and polymorphism', 'Packages, interfaces and exceptions', 'Multithreading and collections', 'GUI programming and JDBC']),
  C('CSEN2031', 'Digital Logic Design', 3, ['B015'], [], [
    'Number systems and Boolean algebra', 'Gate-level minimization', 'Combinational logic circuits', 'Sequential circuits and flip-flops', 'Registers, counters and memory']),
  C('ECEN2001', 'Electronic Devices and Circuits', 4, ['B051'], ['B052'], [
    'PN junction diode and applications', 'Bipolar junction transistor', 'Field effect transistors', 'Transistor biasing and amplifiers', 'Feedback amplifiers and oscillators']),
  C('ECEN2011', 'Signals and Systems', 4, ['B053'], [], [
    'Classification of signals and systems', 'Fourier series and Fourier transform', 'Laplace transform', 'Sampling theorem', 'Z-transform']),
  C('ECEN2021', 'Network Analysis', 3, ['B054'], [], [
    'Circuit elements and Kirchhoff laws', 'Network theorems', 'Transient analysis', 'Resonance and coupled circuits', 'Two-port networks']),
  C('MECH2001', 'Engineering Thermodynamics', 4, ['B065'], [], [
    'Basic concepts and zeroth law', 'First law of thermodynamics', 'Second law and entropy', 'Properties of pure substances', 'Power and refrigeration cycles']),
  C('MECH2011', 'Strength of Materials', 4, ['B066'], [], [
    'Simple stresses and strains', 'Shear force and bending moment', 'Bending and shear stresses in beams', 'Torsion of shafts', 'Columns and struts']),
  C('MECH2021', 'Manufacturing Processes', 3, ['B067'], [], [
    'Casting processes', 'Welding processes', 'Metal forming', 'Sheet metal operations', 'Powder metallurgy']),
  C('CIVL2001', 'Surveying', 3, ['B078'], [], [
    'Chain and compass surveying', 'Levelling and contouring', 'Theodolite surveying', 'Tacheometry', 'Total station and modern surveying']),
  C('BBA2001', 'Marketing Management', 4, ['B079'], [], [
    'Marketing concepts and environment', 'Consumer behaviour', 'Segmentation, targeting and positioning', 'Product and pricing decisions', 'Promotion and distribution']),
  C('BBA2011', 'Organizational Behaviour', 4, ['B082'], [], [
    'Foundations of individual behaviour', 'Motivation theories', 'Group dynamics and teams', 'Leadership', 'Organizational culture and change']),
  C('BBA2021', 'Business Statistics', 3, ['B009'], [], [
    'Data collection and presentation', 'Measures of central tendency and dispersion', 'Probability distributions', 'Correlation and regression', 'Index numbers and time series']),

  // Third year cores
  C('CSEN3001', 'Design and Analysis of Algorithms', 4, ['B016'], ['B017'], [
    'Asymptotic analysis and recurrences', 'Divide and conquer', 'Greedy algorithms', 'Dynamic programming', 'Graph algorithms and NP-completeness']),
  C('CSEN3011', 'Database Management Systems', 4, ['B018'], ['B019'], [
    'ER model and relational model', 'SQL and relational algebra', 'Normalization', 'Transactions and concurrency control', 'Indexing and query processing']),
  C('CSEN3021', 'Operating Systems', 4, ['B020'], ['B021'], [
    'Processes and threads', 'CPU scheduling and synchronization', 'Deadlocks', 'Memory management and virtual memory', 'File systems and disk scheduling']),
  C('CSEN3031', 'Computer Networks', 4, ['B022'], ['B023'], [
    'Network models and physical layer', 'Data link layer and MAC', 'Network layer and routing', 'Transport layer: TCP and UDP', 'Application layer: HTTP, DNS, SMTP']),
  C('CSAI3001', 'Artificial Intelligence', 4, ['B031'], [], [
    'Intelligent agents', 'Uninformed and informed search', 'Adversarial search and games', 'Knowledge representation and logic', 'Planning and reasoning under uncertainty']),
  C('ECEN3001', 'Communication Systems', 4, ['B055'], [], [
    'Amplitude modulation', 'Angle modulation', 'Noise in communication systems', 'Pulse modulation', 'Digital modulation techniques']),
  C('ECEN3011', 'Digital Signal Processing', 4, ['B056'], [], [
    'Discrete-time signals and systems', 'DFT and FFT algorithms', 'IIR filter design', 'FIR filter design', 'Multirate signal processing']),
  C('ECEN3021', 'Microprocessors and Microcontrollers', 4, ['B057', 'B058'], [], [
    '8085 architecture', '8085 assembly programming', '8051 architecture', '8051 programming and timers', 'Peripheral interfacing']),
  C('ECEN3031', 'Electromagnetic Waves and Transmission Lines', 3, ['B059'], [], [
    'Electrostatics', 'Magnetostatics', 'Maxwell equations', 'Uniform plane waves', 'Transmission lines and Smith chart']),
  C('MECH3001', 'Heat Transfer', 4, ['B068'], [], [
    'Steady state conduction', 'Transient conduction', 'Forced and free convection', 'Radiation heat transfer', 'Heat exchangers']),
  C('MECH3011', 'Design of Machine Elements', 4, ['B069'], ['B073'], [
    'Design for static and fatigue loads', 'Shafts, keys and couplings', 'Threaded and welded joints', 'Springs', 'Bearings and gears']),
  C('MECH3021', 'Fluid Mechanics and Hydraulic Machines', 4, ['B070'], [], [
    'Fluid properties and statics', 'Fluid kinematics and dynamics', 'Flow through pipes', 'Hydraulic turbines', 'Centrifugal and reciprocating pumps']),
  C('CIVL3001', 'Structural Analysis', 4, ['B074'], [], [
    'Analysis of trusses', 'Deflection of beams', 'Influence lines', 'Moment distribution method', 'Slope deflection method']),
  C('CIVL3011', 'Geotechnical Engineering', 4, ['B075'], [], [
    'Soil classification and properties', 'Permeability and seepage', 'Consolidation', 'Shear strength of soils', 'Shallow and deep foundations']),
  C('CIVL3021', 'Design of Reinforced Concrete Structures', 4, ['B076'], [], [
    'Limit state design philosophy', 'Design of beams', 'Design of slabs', 'Design of columns', 'Design of footings']),
  C('BBA3001', 'Financial Management', 4, ['B080'], [], [
    'Time value of money', 'Capital budgeting', 'Cost of capital', 'Capital structure and dividend policy', 'Working capital management']),
  C('BBA3011', 'Human Resource Management', 4, ['B081'], [], [
    'HR planning and job analysis', 'Recruitment and selection', 'Training and development', 'Performance appraisal', 'Compensation and industrial relations']),

  // Third year electives
  C('CSEN3101', 'Machine Learning', 3, ['B028', 'B029'], ['B030', 'B040'], [
    'Introduction: supervised and unsupervised learning', 'Regression and classification models', 'Decision trees and ensemble methods', 'Support vector machines and kernels', 'Clustering and dimensionality reduction']),
  C('CSEN3111', 'Web Technologies', 3, ['B041'], ['B042', 'B043'], [
    'HTML5 and CSS3', 'JavaScript and DOM', 'XML and JSON', 'Server-side programming', 'Frontend frameworks: React']),
  C('CSEN3121', 'Cloud Computing', 3, ['B044'], ['B045'], [
    'Cloud models: IaaS, PaaS, SaaS', 'Virtualization', 'Cloud storage and data centres', 'MapReduce programming', 'Cloud security']),
  C('CSEN3131', 'Cryptography and Network Security', 3, ['B046'], ['B047'], [
    'Classical ciphers', 'Block ciphers: DES and AES', 'Public key cryptography: RSA', 'Hash functions and digital signatures', 'Network and web security']),
  C('ECEN3101', 'VLSI Design', 3, ['B060'], [], [
    'MOS transistor theory', 'CMOS fabrication', 'CMOS logic design', 'Timing and power', 'Verilog HDL']),
  C('ECEN3111', 'Embedded Systems', 3, ['B061'], ['B058'], [
    'Embedded system architecture', 'ARM processors', 'Real-time operating systems', 'Device drivers', 'Embedded system design case studies']),
  C('MECH3101', 'Automobile Engineering', 3, ['B071'], [], [
    'Vehicle layout and engines', 'Transmission systems', 'Steering and suspension', 'Braking systems', 'Electric and hybrid vehicles']),
  C('MECH3111', 'Robotics', 3, ['B072'], [], [
    'Robot anatomy and configurations', 'Forward kinematics', 'Inverse kinematics', 'Robot dynamics', 'Trajectory planning and control']),
  C('CIVL3101', 'Remote Sensing and GIS', 3, ['B077'], [], [
    'Principles of remote sensing', 'Satellite platforms and sensors', 'Image interpretation', 'GIS data models', 'GIS applications in civil engineering']),
  C('BBA3101', 'Digital Marketing', 3, ['B084'], ['B079'], [
    'Digital marketing landscape', 'Search engine optimisation', 'Social media marketing', 'Content and email marketing', 'Web analytics']),
  C('BBA3111', 'Business Analytics', 3, ['B085'], ['B037'], [
    'Descriptive analytics', 'Data visualisation', 'Regression and forecasting', 'Optimisation models', 'Decision analysis']),

  // Fourth year
  C('CSEN4001', 'Compiler Design', 4, ['B024'], [], [
    'Lexical analysis', 'Syntax analysis: top-down and bottom-up parsing', 'Syntax directed translation', 'Intermediate code generation', 'Code optimization and generation']),
  C('CSEN4011', 'Software Engineering', 3, ['B025'], ['B026', 'B094'], [
    'Software process models and agile', 'Requirements engineering', 'Design concepts and UML', 'Software testing', 'Project management and quality']),
  C('ECEN4001', 'Wireless Communications', 4, ['B064'], [], [
    'Cellular concept', 'Mobile radio propagation', 'Fading and diversity', 'Multiple access techniques', '4G and 5G systems']),
  C('CSEN4101', 'Deep Learning', 3, ['B032'], ['B033', 'B029'], [
    'Neural networks and backpropagation', 'Optimization and regularization', 'Convolutional neural networks', 'Recurrent networks and LSTMs', 'Generative models and transformers']),
  C('CSEN4111', 'Natural Language Processing', 3, ['B034'], ['B035'], [
    'Text processing and regular expressions', 'Language models and n-grams', 'POS tagging and parsing', 'Word embeddings', 'Text classification and machine translation']),
  C('CSEN4121', 'Big Data Analytics', 3, ['B038', 'B039'], ['B037'], [
    'Big data and Hadoop ecosystem', 'HDFS and MapReduce', 'Spark programming', 'Mining data streams', 'Recommendation systems and link analysis']),
  C('CSEN4131', 'Computer Vision', 3, ['B036'], ['B062'], [
    'Image formation and filtering', 'Feature detection and matching', 'Segmentation', 'Object recognition with CNNs', 'Structure from motion']),
  C('CSEN4141', 'Blockchain Technologies', 3, ['B048'], ['B046'], [
    'Distributed ledger fundamentals', 'Cryptographic primitives', 'Bitcoin and consensus', 'Ethereum and smart contracts', 'Blockchain applications']),
  C('ECEN4101', 'Digital Image Processing', 3, ['B062'], [], [
    'Image fundamentals', 'Intensity transformations and spatial filtering', 'Frequency domain filtering', 'Image restoration', 'Segmentation and compression']),
  C('ECEN4111', 'Internet of Things', 3, ['B063'], ['B061'], [
    'IoT architecture', 'Sensors and actuators', 'IoT protocols: MQTT, CoAP', 'IoT platforms and cloud', 'IoT applications']),
];

// Curriculum: core courses per semester and elective pools.
export const CURRICULUM = {
  CSE: {
    core: { 1: ['MATH1001', 'PHYS1001', 'CSEN1001', 'MECH1001', 'ENGL1001'], 3: ['MATH2001', 'CSEN2001', 'CSEN2011', 'CSEN2021', 'CSEN2031'], 5: ['CSEN3001', 'CSEN3011', 'CSEN3021', 'CSEN3031'], 7: ['CSEN4001', 'CSEN4011'] },
    electives: { 5: ['CSEN3101', 'CSEN3111', 'CSEN3121', 'CSEN3131'], 7: ['CSEN4101', 'CSEN4111', 'CSEN4121', 'CSEN4131', 'CSEN4141'] },
  },
  AIML: {
    core: { 1: ['MATH1001', 'PHYS1001', 'CSEN1001', 'MECH1001', 'ENGL1001'], 3: ['MATH2001', 'CSEN2001', 'CSEN2011', 'CSEN2021', 'CSEN2031'], 5: ['CSEN3001', 'CSEN3011', 'CSAI3001', 'CSEN3101'], 7: ['CSEN4101', 'CSEN4011'] },
    electives: { 5: ['CSEN3111', 'CSEN3121', 'CSEN3131'], 7: ['CSEN4111', 'CSEN4121', 'CSEN4131'] },
  },
  ECE: {
    core: { 1: ['MATH1001', 'PHYS1001', 'CSEN1001', 'MECH1001', 'ENGL1001'], 3: ['MATH2001', 'ECEN2001', 'ECEN2011', 'ECEN2021', 'CSEN2031'], 5: ['ECEN3001', 'ECEN3011', 'ECEN3021', 'ECEN3031'], 7: ['ECEN4001'] },
    electives: { 5: ['ECEN3101', 'ECEN3111', 'CSEN3101'], 7: ['ECEN4101', 'ECEN4111', 'CSEN4101'] },
  },
  ME: {
    core: { 1: ['MATH1001', 'PHYS1001', 'CSEN1001', 'MECH1001', 'ENGL1001'], 3: ['MATH2001', 'MECH2001', 'MECH2011', 'MECH2021'], 5: ['MECH3001', 'MECH3011', 'MECH3021'], 7: [] },
    electives: { 5: ['MECH3101', 'MECH3111'], 7: [] },
  },
  CE: {
    core: { 1: ['MATH1001', 'PHYS1001', 'CSEN1001', 'MECH1001', 'ENGL1001'], 3: ['MATH2001', 'CIVL2001', 'MECH2011'], 5: ['CIVL3001', 'CIVL3011', 'CIVL3021'], 7: [] },
    electives: { 5: ['CIVL3101'], 7: [] },
  },
  BBA: {
    core: { 1: ['BBA1001', 'BBA1011', 'ENGL1001'], 3: ['BBA2001', 'BBA2011', 'BBA2021'], 5: ['BBA3001', 'BBA3011'] },
    electives: { 5: ['BBA3101', 'BBA3111'] },
  },
};

export function coreCourses(program, semester) {
  return (CURRICULUM[program]?.core?.[semester]) || [];
}

export function completedCourses(program, semester, pastElectives = []) {
  const cur = CURRICULUM[program];
  if (!cur) return [];
  const out = [];
  Object.keys(cur.core).forEach((s) => {
    if (Number(s) < semester) out.push(...cur.core[s]);
  });
  return [...out, ...pastElectives];
}

// Catalogue seed. Row format:
// [id, title, authors, publisher, year, edition, subject, callNo, category, copies, tags]
const ROWS = [
  // Mathematics & sciences
  ['B001', 'Higher Engineering Mathematics', 'B.S. Grewal', 'Khanna Publishers', 2020, '44th', 'Mathematics', '510.2462 GRE', 'Textbook', 8, 'calculus,matrices,linear algebra,differential equations,laplace transform,fourier series,engineering mathematics'],
  ['B002', 'Advanced Engineering Mathematics', 'Erwin Kreyszig', 'Wiley India', 2019, '10th', 'Mathematics', '510.2462 KRE', 'Reference', 5, 'linear algebra,vector calculus,complex analysis,differential equations,engineering mathematics'],
  ['B003', 'Engineering Physics', 'M.N. Avadhanulu, P.G. Kshirsagar', 'S. Chand', 2018, 'Revised', 'Physics', '530.02462 AVA', 'Textbook', 6, 'optics,quantum mechanics,lasers,semiconductors,physics'],
  ['B009', 'Probability and Statistics for Engineers and Scientists', 'Ronald E. Walpole, Raymond H. Myers', 'Pearson', 2016, '9th', 'Mathematics', '519.5 WAL', 'Textbook', 6, 'probability,statistics,random variables,distributions,hypothesis testing,regression'],
  ['B012', 'Discrete Mathematics and Its Applications', 'Kenneth H. Rosen', 'McGraw Hill', 2019, '8th', 'Mathematics', '511.1 ROS', 'Textbook', 6, 'logic,sets,relations,graph theory,combinatorics,discrete mathematics,proofs'],

  // Programming fundamentals
  ['B004', 'Let Us C', 'Yashavant Kanetkar', 'BPB Publications', 2021, '18th', 'Computer Science', '005.133 KAN', 'Textbook', 7, 'c programming,pointers,arrays,structures,programming basics'],
  ['B005', 'The C Programming Language', 'Brian W. Kernighan, Dennis M. Ritchie', 'Pearson', 2015, '2nd', 'Computer Science', '005.133 KER', 'Textbook', 5, 'c programming,pointers,memory,unix,programming basics'],
  ['B006', 'Programming in ANSI C', 'E. Balagurusamy', 'McGraw Hill', 2019, '8th', 'Computer Science', '005.133 BAL', 'Reference', 6, 'c programming,arrays,functions,file handling,programming basics'],
  ['B049', 'Python Crash Course', 'Eric Matthes', 'No Starch Press', 2019, '2nd', 'Computer Science', '005.133 MAT', 'General', 4, 'python,programming basics,projects,data visualization,programming'],
  ['B050', 'Automate the Boring Stuff with Python', 'Al Sweigart', 'No Starch Press', 2019, '2nd', 'Computer Science', '005.133 SWE', 'General', 3, 'python,automation,scripting,programming'],

  // Core CSE
  ['B010', 'Data Structures Using C', 'Reema Thareja', 'Oxford University Press', 2014, '2nd', 'Computer Science', '005.73 THA', 'Textbook', 7, 'data structures,linked lists,stacks,queues,trees,graphs,sorting,c programming'],
  ['B011', 'Fundamentals of Data Structures in C', 'Ellis Horowitz, Sartaj Sahni, Susan Anderson-Freed', 'Universities Press', 2008, '2nd', 'Computer Science', '005.73 HOR', 'Reference', 4, 'data structures,trees,graphs,hashing,heaps,sorting'],
  ['B013', 'Java: The Complete Reference', 'Herbert Schildt', 'McGraw Hill', 2020, '11th', 'Computer Science', '005.133 SCH', 'Textbook', 6, 'java,object oriented programming,collections,multithreading,exceptions'],
  ['B014', 'Head First Java', 'Kathy Sierra, Bert Bates', "O'Reilly", 2005, '2nd', 'Computer Science', '005.133 SIE', 'Reference', 3, 'java,object oriented programming,inheritance,polymorphism'],
  ['B015', 'Digital Design', 'M. Morris Mano, Michael D. Ciletti', 'Pearson', 2018, '6th', 'Electronics', '621.395 MAN', 'Textbook', 7, 'digital logic,boolean algebra,combinational circuits,sequential circuits,flip flops,verilog'],
  ['B016', 'Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', 'MIT Press', 2009, '3rd', 'Computer Science', '005.1 COR', 'Textbook', 6, 'algorithms,dynamic programming,greedy,graph algorithms,complexity,divide and conquer'],
  ['B017', 'Algorithm Design', 'Jon Kleinberg, Éva Tardos', 'Pearson', 2013, '1st', 'Computer Science', '005.1 KLE', 'Reference', 3, 'algorithms,network flow,np completeness,greedy,dynamic programming'],
  ['B018', 'Database System Concepts', 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan', 'McGraw Hill', 2019, '7th', 'Computer Science', '005.74 SIL', 'Textbook', 7, 'databases,sql,er model,normalization,transactions,indexing,query processing'],
  ['B019', 'Fundamentals of Database Systems', 'Ramez Elmasri, Shamkant B. Navathe', 'Pearson', 2017, '7th', 'Computer Science', '005.74 ELM', 'Reference', 4, 'databases,sql,relational algebra,normalization,nosql'],
  ['B020', 'Operating System Concepts', 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne', 'Wiley', 2018, '10th', 'Computer Science', '005.43 SIL', 'Textbook', 7, 'operating systems,processes,threads,scheduling,deadlocks,memory management,file systems'],
  ['B021', 'Modern Operating Systems', 'Andrew S. Tanenbaum, Herbert Bos', 'Pearson', 2014, '4th', 'Computer Science', '005.43 TAN', 'Reference', 4, 'operating systems,virtualization,memory management,security,linux'],
  ['B022', 'Computer Networking: A Top-Down Approach', 'James F. Kurose, Keith W. Ross', 'Pearson', 2017, '7th', 'Computer Science', '004.6 KUR', 'Textbook', 6, 'computer networks,tcp/ip,http,routing,transport layer,network security'],
  ['B023', 'Computer Networks', 'Andrew S. Tanenbaum, David J. Wetherall', 'Pearson', 2013, '5th', 'Computer Science', '004.6 TAN', 'Reference', 4, 'computer networks,physical layer,data link layer,routing,osi model'],
  ['B024', 'Compilers: Principles, Techniques, and Tools', 'Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman', 'Pearson', 2006, '2nd', 'Computer Science', '005.453 AHO', 'Textbook', 5, 'compilers,lexical analysis,parsing,syntax directed translation,code generation,optimization'],
  ['B025', "Software Engineering: A Practitioner's Approach", 'Roger S. Pressman, Bruce R. Maxim', 'McGraw Hill', 2019, '9th', 'Computer Science', '005.1 PRE', 'Textbook', 5, 'software engineering,sdlc,agile,requirements,testing,project management'],
  ['B026', 'Clean Code', 'Robert C. Martin', 'Prentice Hall', 2008, '1st', 'Computer Science', '005.1 MAR', 'General', 3, 'software engineering,refactoring,best practices,programming'],
  ['B094', 'The Pragmatic Programmer', 'David Thomas, Andrew Hunt', 'Addison-Wesley', 2019, '20th Anniv.', 'Computer Science', '005.1 THO', 'General', 3, 'software engineering,best practices,career,programming'],
  ['B027', 'Cracking the Coding Interview', 'Gayle Laakmann McDowell', 'CareerCup', 2015, '6th', 'Careers & Competitive Exams', '650.14 MCD', 'General', 5, 'placements,interviews,algorithms,data structures,competitive programming'],

  // AI / ML / Data
  ['B028', 'Machine Learning', 'Tom M. Mitchell', 'McGraw Hill', 2017, 'Indian Ed.', 'Artificial Intelligence', '006.31 MIT', 'Textbook', 5, 'machine learning,decision trees,neural networks,bayesian learning,concept learning'],
  ['B029', 'Hands-On Machine Learning with Scikit-Learn, Keras and TensorFlow', 'Aurélien Géron', "O'Reilly", 2019, '2nd', 'Artificial Intelligence', '006.31 GER', 'Textbook', 3, 'machine learning,deep learning,python,scikit-learn,tensorflow,keras,data science'],
  ['B030', 'Pattern Recognition and Machine Learning', 'Christopher M. Bishop', 'Springer', 2006, '1st', 'Artificial Intelligence', '006.4 BIS', 'Reference', 3, 'machine learning,probability,bayesian,kernel methods,graphical models,pattern recognition'],
  ['B031', 'Artificial Intelligence: A Modern Approach', 'Stuart Russell, Peter Norvig', 'Pearson', 2021, '4th', 'Artificial Intelligence', '006.3 RUS', 'Textbook', 5, 'artificial intelligence,search,agents,knowledge representation,planning,reasoning'],
  ['B032', 'Deep Learning', 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', 'MIT Press', 2016, '1st', 'Artificial Intelligence', '006.31 GOO', 'Textbook', 4, 'deep learning,neural networks,cnn,rnn,optimization,regularization'],
  ['B033', 'Deep Learning with Python', 'François Chollet', 'Manning', 2021, '2nd', 'Artificial Intelligence', '006.31 CHO', 'Reference', 4, 'deep learning,keras,python,neural networks,computer vision,nlp'],
  ['B034', 'Speech and Language Processing', 'Daniel Jurafsky, James H. Martin', 'Pearson', 2014, '2nd', 'Artificial Intelligence', '006.35 JUR', 'Textbook', 3, 'nlp,natural language processing,language models,parsing,speech recognition'],
  ['B035', 'Natural Language Processing with Python', 'Steven Bird, Ewan Klein, Edward Loper', "O'Reilly", 2009, '1st', 'Artificial Intelligence', '006.35 BIR', 'Reference', 3, 'nlp,natural language processing,python,nltk,text classification'],
  ['B036', 'Computer Vision: Algorithms and Applications', 'Richard Szeliski', 'Springer', 2022, '2nd', 'Artificial Intelligence', '006.37 SZE', 'Textbook', 3, 'computer vision,image processing,feature detection,segmentation,3d reconstruction,deep learning'],
  ['B037', 'Python for Data Analysis', 'Wes McKinney', "O'Reilly", 2022, '3rd', 'Artificial Intelligence', '005.133 MCK', 'Reference', 4, 'python,pandas,numpy,data analysis,data science,data visualization'],
  ['B038', 'Mining of Massive Datasets', 'Jure Leskovec, Anand Rajaraman, Jeffrey D. Ullman', 'Cambridge University Press', 2020, '3rd', 'Artificial Intelligence', '006.312 LES', 'Textbook', 3, 'big data,mapreduce,recommendation systems,data mining,clustering,streams'],
  ['B039', 'Hadoop: The Definitive Guide', 'Tom White', "O'Reilly", 2015, '4th', 'Computer Science', '005.74 WHI', 'Reference', 3, 'big data,hadoop,mapreduce,hdfs,spark,distributed systems'],
  ['B040', 'The Hundred-Page Machine Learning Book', 'Andriy Burkov', 'Andriy Burkov', 2019, '1st', 'Artificial Intelligence', '006.31 BUR', 'General', 3, 'machine learning,data science,supervised learning,unsupervised learning'],

  // Web, cloud, security
  ['B041', 'Web Technologies', 'Uttam K. Roy', 'Oxford University Press', 2010, '1st', 'Computer Science', '006.76 ROY', 'Textbook', 5, 'web development,html,css,javascript,xml,servlets,jsp'],
  ['B042', 'Eloquent JavaScript', 'Marijn Haverbeke', 'No Starch Press', 2018, '3rd', 'Computer Science', '005.2762 HAV', 'Reference', 3, 'javascript,web development,node.js,programming'],
  ['B043', 'Learning React', 'Alex Banks, Eve Porcello', "O'Reilly", 2020, '2nd', 'Computer Science', '005.2762 BAN', 'Reference', 3, 'react,javascript,web development,frontend,hooks'],
  ['B044', 'Cloud Computing: Concepts, Technology and Architecture', 'Thomas Erl, Ricardo Puttini, Zaigham Mahmood', 'Pearson', 2013, '1st', 'Computer Science', '004.6782 ERL', 'Textbook', 4, 'cloud computing,virtualization,iaas,paas,saas,distributed systems'],
  ['B045', 'Mastering Cloud Computing', 'Rajkumar Buyya, Christian Vecchiola, S. Thamarai Selvi', 'McGraw Hill', 2013, '1st', 'Computer Science', '004.6782 BUY', 'Reference', 3, 'cloud computing,aneka,mapreduce,virtualization,distributed systems'],
  ['B046', 'Cryptography and Network Security: Principles and Practice', 'William Stallings', 'Pearson', 2017, '7th', 'Computer Science', '005.82 STA', 'Textbook', 5, 'cryptography,network security,encryption,rsa,aes,hashing,authentication'],
  ['B047', 'Cryptography and Network Security', 'Behrouz A. Forouzan, Debdeep Mukhopadhyay', 'McGraw Hill', 2015, '3rd', 'Computer Science', '005.82 FOR', 'Reference', 3, 'cryptography,network security,ciphers,digital signatures'],
  ['B048', 'Mastering Bitcoin', 'Andreas M. Antonopoulos', "O'Reilly", 2017, '2nd', 'Computer Science', '332.178 ANT', 'Textbook', 3, 'blockchain,bitcoin,cryptocurrency,cryptography,distributed ledger'],

  // Electronics & communication
  ['B051', 'Electronic Devices and Circuit Theory', 'Robert L. Boylestad, Louis Nashelsky', 'Pearson', 2015, '11th', 'Electronics', '621.3815 BOY', 'Textbook', 7, 'electronic devices,diodes,transistors,bjt,fet,amplifiers,analog electronics'],
  ['B052', 'Integrated Electronics', 'Jacob Millman, Christos Halkias', 'McGraw Hill', 2017, '2nd', 'Electronics', '621.3815 MIL', 'Reference', 4, 'analog electronics,transistors,amplifiers,oscillators,integrated circuits'],
  ['B053', 'Signals and Systems', 'Alan V. Oppenheim, Alan S. Willsky, S. Hamid Nawab', 'Pearson', 2015, '2nd', 'Electronics', '621.3822 OPP', 'Textbook', 6, 'signals,systems,fourier transform,laplace transform,z transform,convolution,sampling'],
  ['B054', 'Network Analysis', 'M.E. Van Valkenburg', 'Pearson', 2015, '3rd', 'Electronics', '621.3192 VAN', 'Textbook', 5, 'circuit analysis,network theorems,transients,two port networks,electrical circuits'],
  ['B055', 'Communication Systems', 'Simon Haykin, Michael Moher', 'Wiley', 2010, '5th', 'Electronics', '621.382 HAY', 'Textbook', 5, 'communication systems,modulation,am,fm,noise,digital communication'],
  ['B056', 'Digital Signal Processing: Principles, Algorithms and Applications', 'John G. Proakis, Dimitris G. Manolakis', 'Pearson', 2007, '4th', 'Electronics', '621.3822 PRO', 'Textbook', 5, 'dsp,digital signal processing,dft,fft,filter design,z transform'],
  ['B057', 'Microprocessor Architecture, Programming and Applications with the 8085', 'Ramesh S. Gaonkar', 'Penram International', 2013, '6th', 'Electronics', '004.165 GAO', 'Textbook', 5, 'microprocessors,8085,assembly language,interfacing'],
  ['B058', 'The 8051 Microcontroller and Embedded Systems', 'Muhammad Ali Mazidi, Janice Gillispie Mazidi', 'Pearson', 2011, '2nd', 'Electronics', '004.165 MAZ', 'Textbook', 5, 'microcontrollers,8051,embedded systems,assembly language,interfacing'],
  ['B059', 'Elements of Electromagnetics', 'Matthew N.O. Sadiku', 'Oxford University Press', 2018, '7th', 'Electronics', '537 SAD', 'Textbook', 5, 'electromagnetics,maxwell equations,transmission lines,waveguides,antennas'],
  ['B060', 'CMOS VLSI Design: A Circuits and Systems Perspective', 'Neil H.E. Weste, David Money Harris', 'Pearson', 2015, '4th', 'Electronics', '621.395 WES', 'Textbook', 3, 'vlsi,cmos,digital ic design,layout,timing'],
  ['B061', 'Embedded Systems: Architecture, Programming and Design', 'Raj Kamal', 'McGraw Hill', 2017, '3rd', 'Electronics', '004.16 KAM', 'Textbook', 4, 'embedded systems,rtos,microcontrollers,arm,device drivers,iot'],
  ['B062', 'Digital Image Processing', 'Rafael C. Gonzalez, Richard E. Woods', 'Pearson', 2018, '4th', 'Electronics', '621.367 GON', 'Textbook', 4, 'image processing,filtering,segmentation,morphology,compression,computer vision'],
  ['B063', 'Internet of Things: A Hands-On Approach', 'Arshdeep Bahga, Vijay Madisetti', 'Universities Press', 2015, '1st', 'Electronics', '004.678 BAH', 'Textbook', 4, 'iot,internet of things,sensors,raspberry pi,cloud,embedded systems'],
  ['B064', 'Wireless Communications: Principles and Practice', 'Theodore S. Rappaport', 'Pearson', 2010, '2nd', 'Electronics', '621.384 RAP', 'Textbook', 4, 'wireless communication,cellular,fading,multiple access,mobile radio'],

  // Mechanical
  ['B065', 'Engineering Thermodynamics', 'P.K. Nag', 'McGraw Hill', 2017, '6th', 'Mechanical Engineering', '621.4021 NAG', 'Textbook', 6, 'thermodynamics,entropy,laws of thermodynamics,power cycles,refrigeration'],
  ['B066', 'Strength of Materials', 'R.K. Bansal', 'Laxmi Publications', 2018, '6th', 'Mechanical Engineering', '620.112 BAN', 'Textbook', 6, 'strength of materials,stress,strain,bending,torsion,beams,columns'],
  ['B067', 'Manufacturing Technology Vol. 1', 'P.N. Rao', 'McGraw Hill', 2018, '5th', 'Mechanical Engineering', '670.42 RAO', 'Textbook', 5, 'manufacturing,casting,welding,forming,machining'],
  ['B068', 'Heat and Mass Transfer', 'R.K. Rajput', 'S. Chand', 2019, '6th', 'Mechanical Engineering', '621.4022 RAJ', 'Textbook', 5, 'heat transfer,conduction,convection,radiation,heat exchangers,mass transfer'],
  ['B069', 'Design of Machine Elements', 'V.B. Bhandari', 'McGraw Hill', 2016, '4th', 'Mechanical Engineering', '621.815 BHA', 'Textbook', 5, 'machine design,shafts,gears,bearings,springs,fasteners'],
  ['B070', 'Fluid Mechanics and Hydraulic Machines', 'R.K. Bansal', 'Laxmi Publications', 2018, '10th', 'Mechanical Engineering', '620.106 BAN', 'Textbook', 5, 'fluid mechanics,turbines,pumps,flow measurement,hydraulics'],
  ['B071', 'Automobile Engineering Vol. 1', 'Kirpal Singh', 'Standard Publishers', 2017, '14th', 'Mechanical Engineering', '629.2 SIN', 'Textbook', 3, 'automobile,engines,transmission,steering,brakes,vehicles'],
  ['B072', 'Introduction to Robotics: Mechanics and Control', 'John J. Craig', 'Pearson', 2017, '4th', 'Mechanical Engineering', '629.892 CRA', 'Textbook', 3, 'robotics,kinematics,dynamics,manipulators,control,trajectory planning'],
  ['B073', "Shigley's Mechanical Engineering Design", 'Richard G. Budynas, J. Keith Nisbett', 'McGraw Hill', 2020, '11th', 'Mechanical Engineering', '621.815 BUD', 'Reference', 3, 'machine design,fatigue,gears,shafts,failure theories'],

  // Civil
  ['B074', 'Structural Analysis', 'R.C. Hibbeler', 'Pearson', 2017, '10th', 'Civil Engineering', '624.171 HIB', 'Textbook', 4, 'structural analysis,trusses,beams,frames,influence lines,deflection'],
  ['B075', 'Soil Mechanics and Foundations', 'B.C. Punmia, Ashok Kumar Jain, Arun Kumar Jain', 'Laxmi Publications', 2017, '17th', 'Civil Engineering', '624.15136 PUN', 'Textbook', 4, 'soil mechanics,geotechnical,foundations,consolidation,shear strength'],
  ['B076', 'Reinforced Concrete Design', 'S. Unnikrishna Pillai, Devdas Menon', 'McGraw Hill', 2021, '4th', 'Civil Engineering', '624.18341 PIL', 'Textbook', 4, 'reinforced concrete,limit state design,beams,slabs,columns,is 456'],
  ['B077', 'Remote Sensing and GIS', 'Basudeb Bhatta', 'Oxford University Press', 2020, '3rd', 'Civil Engineering', '621.3678 BHA', 'Textbook', 3, 'remote sensing,gis,satellite imagery,gps,spatial analysis'],
  ['B078', 'Surveying Vol. 1', 'B.C. Punmia, Ashok Kumar Jain', 'Laxmi Publications', 2016, '17th', 'Civil Engineering', '526.9 PUN', 'Textbook', 4, 'surveying,levelling,chain surveying,compass,theodolite'],
  ['B007', 'Engineering Drawing', 'N.D. Bhatt', 'Charotar Publishing', 2019, '53rd', 'Mechanical Engineering', '604.2 BHA', 'Textbook', 7, 'engineering drawing,projections,orthographic,isometric,graphics'],

  // Management & economics
  ['B079', 'Marketing Management', 'Philip Kotler, Kevin Lane Keller', 'Pearson', 2016, '15th', 'Management', '658.8 KOT', 'Textbook', 5, 'marketing,consumer behaviour,branding,pricing,market segmentation'],
  ['B080', 'Financial Management: Theory and Practice', 'Prasanna Chandra', 'McGraw Hill', 2019, '10th', 'Management', '658.15 CHA', 'Textbook', 5, 'finance,capital budgeting,cost of capital,working capital,valuation'],
  ['B081', 'Human Resource Management', 'Gary Dessler, Biju Varkkey', 'Pearson', 2020, '16th', 'Management', '658.3 DES', 'Textbook', 4, 'human resources,recruitment,training,performance appraisal,compensation'],
  ['B082', 'Organizational Behaviour', 'Stephen P. Robbins, Timothy A. Judge', 'Pearson', 2018, '18th', 'Management', '658.4 ROB', 'Textbook', 4, 'organizational behaviour,motivation,leadership,teams,psychology'],
  ['B083', 'Financial Accounting', 'S.N. Maheshwari, Suneel K. Maheshwari', 'Vikas Publishing', 2018, '6th', 'Management', '657 MAH', 'Textbook', 5, 'accounting,journal,ledger,balance sheet,final accounts,finance'],
  ['B084', 'Digital Marketing', 'Seema Gupta', 'McGraw Hill', 2020, '2nd', 'Management', '658.872 GUP', 'Textbook', 3, 'digital marketing,seo,social media,content marketing,analytics,marketing'],
  ['B085', 'Business Analytics: Data Analysis and Decision Making', 'S. Christian Albright, Wayne L. Winston', 'Cengage', 2019, '6th', 'Management', '658.4033 ALB', 'Textbook', 3, 'business analytics,regression,forecasting,data analysis,decision making,excel'],
  ['B086', 'Principles of Economics', 'N. Gregory Mankiw', 'Cengage', 2020, '8th', 'Economics', '330 MAN', 'Textbook', 5, 'economics,microeconomics,macroeconomics,demand,supply,markets'],

  // General reading & careers
  ['B008', 'Word Power Made Easy', 'Norman Lewis', 'Penguin Random House', 2015, 'Revised', 'Language & Communication', '428.1 LEW', 'General', 5, 'english,vocabulary,communication,language'],
  ['B087', 'Atomic Habits', 'James Clear', 'Penguin Random House', 2018, '1st', 'General Reading', '158.1 CLE', 'General', 4, 'self-help,habits,productivity,psychology'],
  ['B088', 'Wings of Fire', 'A.P.J. Abdul Kalam, Arun Tiwari', 'Universities Press', 1999, '1st', 'General Reading', '923.5 KAL', 'General', 4, 'biography,inspiration,india,space,science'],
  ['B089', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'Penguin Random House', 2015, '1st', 'General Reading', '909 HAR', 'General', 3, 'history,anthropology,society,non-fiction'],
  ['B090', 'The Psychology of Money', 'Morgan Housel', 'Jaico Publishing', 2020, '1st', 'General Reading', '332.024 HOU', 'General', 3, 'finance,personal finance,psychology,investing,self-help'],
  ['B091', 'Rich Dad Poor Dad', 'Robert T. Kiyosaki', 'Plata Publishing', 2017, '20th Anniv.', 'General Reading', '332.024 KIY', 'General', 3, 'finance,personal finance,investing,self-help'],
  ['B092', 'Thinking, Fast and Slow', 'Daniel Kahneman', 'Penguin Random House', 2012, '1st', 'General Reading', '153.42 KAH', 'General', 3, 'psychology,decision making,behavioural economics,non-fiction'],
  ['B093', 'Zero to One', 'Peter Thiel, Blake Masters', 'Crown Business', 2014, '1st', 'General Reading', '658.11 THI', 'General', 3, 'startups,entrepreneurship,innovation,business'],
  ['B095', 'Quantitative Aptitude for Competitive Examinations', 'R.S. Aggarwal', 'S. Chand', 2021, 'Revised', 'Careers & Competitive Exams', '513.076 AGG', 'General', 6, 'placements,aptitude,quantitative aptitude,competitive exams'],
  ['B096', 'A Modern Approach to Verbal and Non-Verbal Reasoning', 'R.S. Aggarwal', 'S. Chand', 2021, 'Revised', 'Careers & Competitive Exams', '153.43 AGG', 'General', 5, 'placements,reasoning,logical reasoning,competitive exams'],
];

// Library stack layout: floor, section prefix and number of racks per subject.
export const SECTIONS = {
  'Mathematics': { floor: 'First Floor', prefix: 'S', name: 'Mathematics & Sciences', color: '#2f6f9f' },
  'Physics': { floor: 'First Floor', prefix: 'S', name: 'Mathematics & Sciences', color: '#2f6f9f' },
  'Computer Science': { floor: 'First Floor', prefix: 'C', name: 'Computer Science', color: '#a6192e' },
  'Artificial Intelligence': { floor: 'First Floor', prefix: 'A', name: 'AI & Data Science', color: '#6b3fa0' },
  'Electronics': { floor: 'Second Floor', prefix: 'E', name: 'Electronics & Communication', color: '#1f7a6d' },
  'Mechanical Engineering': { floor: 'Second Floor', prefix: 'M', name: 'Mechanical Engineering', color: '#b5651d' },
  'Civil Engineering': { floor: 'Second Floor', prefix: 'V', name: 'Civil Engineering', color: '#6d6d2f' },
  'Management': { floor: 'Ground Floor', prefix: 'B', name: 'Management & Economics', color: '#2d5d8a' },
  'Economics': { floor: 'Ground Floor', prefix: 'B', name: 'Management & Economics', color: '#2d5d8a' },
  'General Reading': { floor: 'Ground Floor', prefix: 'G', name: 'General Reading', color: '#5a6470' },
  'Language & Communication': { floor: 'Ground Floor', prefix: 'G', name: 'General Reading', color: '#5a6470' },
  'Careers & Competitive Exams': { floor: 'Ground Floor', prefix: 'P', name: 'Careers & Competitive Exams', color: '#8a5a12' },
};

export const SUBJECTS = Object.keys(SECTIONS);

// Valid ISBN-13 generated from the record id (demo catalogue data).
function makeIsbn(id) {
  const n = parseInt(id.slice(1), 10);
  const body = `9789${String(3510000 + n * 137).padStart(7, '0')}${String((n * 7) % 10)}`.slice(0, 12);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return body + check;
}

export function buildBooks() {
  // Order by call number so neighbouring call numbers share racks, like real stacks.
  const sorted = [...ROWS].sort((a, b) => a[7].localeCompare(b[7], undefined, { numeric: true }));
  const rackCounters = {};
  const books = sorted.map((r) => {
    const [id, title, authors, publisher, year, edition, subject, callNo, category, copies, tags] = r;
    const sec = SECTIONS[subject];
    const key = sec.prefix;
    rackCounters[key] = (rackCounters[key] || 0) + 1;
    const slot = rackCounters[key] - 1;
    const rackNo = Math.floor(slot / 4) + 1; // four titles per rack face in the demo
    const shelf = (slot % 4) + 1;
    const tagList = tags.split(',');
    return {
      id,
      isbn: makeIsbn(id),
      title,
      authors,
      publisher,
      year,
      edition,
      subject,
      callNo,
      category,
      tags: tagList,
      language: 'English',
      pages: 300 + ((parseInt(id.slice(1), 10) * 53) % 700),
      description: `${category === 'General' ? 'Recommended reading' : category} covering ${tagList.slice(0, 4).join(', ')}.`,
      location: {
        floor: sec.floor,
        section: sec.name,
        rack: `${key}-${String(rackNo).padStart(2, '0')}`,
        shelf,
      },
      initialCopies: copies,
      addedOn: null,
    };
  });
  return books.sort((a, b) => a.id.localeCompare(b.id));
}

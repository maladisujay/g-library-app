// 20 demo students. Registration numbers follow a 12-digit pattern:
// 1 (campus) + 2-digit admission year + 2-digit school + 3-digit programme + 4-digit roll.
const S = (regNo, name, gender, dob, program, semester, section, electives, pastElectives, interests, cgpa, residence, phone) => ({
  regNo, name, gender, dob, program, semester, section, electives, pastElectives, interests, cgpa, residence, phone,
});

export const STUDENT_ROWS = [
  S('121910301012', 'Aarav Reddy', 'Male', '2002-03-14', 'CSE', 5, 'A', ['CSEN3101', 'CSEN3121'], [], ['data-science', 'programming', 'placements'], 8.7, 'Hostel', '9848012345'),
  S('121910301027', 'Sai Priya Varma', 'Female', '2002-07-22', 'CSE', 5, 'A', ['CSEN3101', 'CSEN3111'], [], ['data-science', 'self-help', 'web'], 9.1, 'Day Scholar', '9849023456'),
  S('121910301045', 'Karthik Naidu', 'Male', '2001-11-05', 'CSE', 5, 'B', ['CSEN3111', 'CSEN3131'], [], ['web', 'competitive-programming', 'startups'], 7.9, 'Hostel', '9866034567'),
  S('121910301058', 'Harika Chowdary', 'Female', '2002-01-30', 'CSE', 5, 'B', ['CSEN3101', 'CSEN3131'], [], ['data-science', 'placements', 'psychology'], 8.4, 'Day Scholar', '9876045678'),
  S('122010301008', 'Rahul Varma', 'Male', '2003-05-18', 'CSE', 3, 'A', [], [], ['programming', 'competitive-programming'], 8.2, 'Hostel', '9885056789'),
  S('122010301033', 'Sneha Rao', 'Female', '2003-09-02', 'CSE', 3, 'C', [], [], ['programming', 'web', 'self-help'], 8.9, 'Day Scholar', '9701067890'),
  S('121810301019', 'Vamsi Krishna', 'Male', '2001-02-11', 'CSE', 7, 'A', ['CSEN4101', 'CSEN4111'], ['CSEN3101', 'CSEN3121'], ['data-science', 'placements', 'startups'], 8.1, 'Hostel', '9703078901'),
  S('121810301041', 'Lahari Sri', 'Female', '2000-12-25', 'CSE', 7, 'B', ['CSEN4101', 'CSEN4131'], ['CSEN3101', 'CSEN3111'], ['data-science', 'biography', 'self-help'], 9.3, 'Day Scholar', '9704089012'),
  S('122210301004', 'Aditya Kumar', 'Male', '2004-08-09', 'CSE', 1, 'D', [], [], ['programming', 'placements'], null, 'Hostel', '9705090123'),
  S('121910324006', 'Divya Teja', 'Female', '2002-04-27', 'AIML', 5, 'A', ['CSEN3111'], [], ['data-science', 'programming', 'psychology'], 9.0, 'Day Scholar', '9706001234'),
  S('121910324015', 'Rohith Yadav', 'Male', '2002-10-13', 'AIML', 5, 'A', ['CSEN3131'], [], ['data-science', 'competitive-programming', 'finance'], 8.0, 'Hostel', '9707012345'),
  S('121810324022', 'Pranav Sharma', 'Male', '2001-06-01', 'AIML', 7, 'A', ['CSEN4111', 'CSEN4131'], ['CSEN3121'], ['data-science', 'startups', 'history'], 8.6, 'Hostel', '9708023456'),
  S('121910402011', 'Bhavana Reddy', 'Female', '2002-02-19', 'ECE', 5, 'A', ['ECEN3111', 'CSEN3101'], [], ['electronics', 'data-science', 'iot'], 8.8, 'Day Scholar', '9709034567'),
  S('121910402029', 'Manoj Kumar', 'Male', '2001-09-28', 'ECE', 5, 'B', ['ECEN3101', 'ECEN3111'], [], ['electronics', 'iot', 'placements'], 7.6, 'Hostel', '9710045678'),
  S('122010402017', 'Keerthi Lakshmi', 'Female', '2003-03-06', 'ECE', 3, 'A', [], [], ['electronics', 'self-help'], 8.5, 'Day Scholar', '9711056789'),
  S('121810402036', 'Nikhil Raju', 'Male', '2000-11-17', 'ECE', 7, 'A', ['ECEN4101', 'ECEN4111'], ['ECEN3111'], ['iot', 'electronics', 'placements'], 7.8, 'Hostel', '9712067890'),
  S('121910503009', 'Tarun Teja', 'Male', '2002-06-24', 'ME', 5, 'A', ['MECH3111', 'MECH3101'], [], ['robotics', 'startups', 'biography'], 7.4, 'Hostel', '9713078901'),
  S('122010503021', 'Meghana Sai', 'Female', '2003-01-15', 'ME', 3, 'A', [], [], ['robotics', 'self-help'], 8.3, 'Day Scholar', '9714089012'),
  S('121910604013', 'Charan Kumar', 'Male', '2002-08-30', 'CE', 5, 'A', ['CIVL3101'], [], ['history', 'placements'], 7.7, 'Hostel', '9715090123'),
  S('121952201024', 'Ananya Patnaik', 'Female', '2002-05-08', 'BBA', 5, 'A', ['BBA3101', 'BBA3111'], [], ['finance', 'startups', 'psychology'], 8.9, 'Day Scholar', '9716001234'),
];

export const LIBRARIANS = [
  { id: 'LIB001', name: 'Dr. K. Srinivasa Rao', designation: 'Chief Librarian', email: 'librarian@glibrary.edu.in', password: 'admin123' },
  { id: 'LIB002', name: 'P. Lakshmi Prasanna', designation: 'Assistant Librarian', email: 'circulation@glibrary.edu.in', password: 'admin123' },
];

// Interest tags mapped to general-reading titles, used to simulate past borrowing.
export const INTEREST_BOOKS = {
  'data-science': ['B037', 'B040', 'B029', 'B049'],
  programming: ['B049', 'B050', 'B026', 'B094'],
  placements: ['B027', 'B095', 'B096'],
  'competitive-programming': ['B016', 'B027'],
  web: ['B042', 'B043'],
  'self-help': ['B087', 'B090'],
  psychology: ['B092', 'B087'],
  startups: ['B093', 'B090'],
  finance: ['B090', 'B091'],
  biography: ['B088'],
  history: ['B089'],
  electronics: ['B058', 'B052'],
  iot: ['B063', 'B061'],
  robotics: ['B072'],
};

export const INTEREST_OPTIONS = Object.keys(INTEREST_BOOKS);

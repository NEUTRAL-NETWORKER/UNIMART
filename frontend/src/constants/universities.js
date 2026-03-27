// Tamil Nadu Universities Data
// Structure: University -> College -> Departments

export const ENGINEERING_DEPARTMENTS = [
  'Aeronautical Engineering',
  'Agricultural Engineering',
  'Artificial Intelligence & Data Science',
  'Automobile Engineering',
  'Biomedical Engineering',
  'Biotechnology',
  'Chemical Engineering',
  'Civil Engineering',
  'Computer Science and Engineering (CSE)',
  'Electrical and Electronics Engineering (EEE)',
  'Electronics and Communication Engineering (ECE)',
  'Electronics and Instrumentation Engineering',
  'Fashion Technology',
  'Food Technology',
  'Information Technology (IT)',
  'Marine Engineering',
  'Mechanical Engineering',
  'Mechatronics',
  'Production Engineering',
  'Robotics and Automation',
  'Textile Technology'
];

export const ARTS_SCIENCE_DEPARTMENTS = [
  'B.A. Economics',
  'B.A. English Literature',
  'B.A. History',
  'B.A. Tamil Literature',
  'B.B.A. Business Administration',
  'B.C.A. Computer Applications',
  'B.Com. Accounting & Finance',
  'B.Com. Corporate Secretaryship',
  'B.Com. General',
  'B.Sc. Biochemistry',
  'B.Sc. Biotechnology',
  'B.Sc. Chemistry',
  'B.Sc. Computer Science',
  'B.Sc. Mathematics',
  'B.Sc. Microbiology',
  'B.Sc. Physics',
  'B.Sc. Psychology',
  'B.Sc. Statistics',
  'B.Sc. Visual Communication',
  'M.A. Economics',
  'M.A. English',
  'M.Com.',
  'M.Sc. Computer Science',
  'M.Sc. Mathematics',
  'M.Sc. Physics'
];

export const TAMILNADU_UNIVERSITIES = {
  "Anna University": {
    "College of Engineering, Guindy (CEG)": [
      'Civil Engineering', 'Mechanical Engineering', 'Industrial Engineering', 'Manufacturing Engineering', 'Printing Technology', 'Mining Engineering', 'Electrical and Electronics Engineering', 'Electronics and Communication Engineering', 'Computer Science and Engineering', 'Information Technology', 'Horticulture', 'Geo-Informatics'
    ],
    "Madras Institute of Technology (MIT)": [
      'Aeronautical Engineering', 'Automobile Engineering', 'Electronics and Instrumentation Engineering', 'Production Engineering', 'Rubber and Plastics Technology', 'Information Technology', 'Computer Science and Engineering', 'Electronics and Communication Engineering'
    ],
    "Alagappa College of Technology (ACT)": [
      'Chemical Engineering', 'Textile Technology', 'Biotechnology', 'Ceramic Technology', 'Food Technology', 'Industrial Bio-Technology', 'Leather Technology', 'Petroleum Engineering and Technology', 'Pharmaceutical Technology'
    ],
    "SSN College of Engineering": ENGINEERING_DEPARTMENTS,
    "Sri Venkateswara College of Engineering (SVCE)": ENGINEERING_DEPARTMENTS,
    "PSG College of Technology": [
       ...ENGINEERING_DEPARTMENTS, 'Robotics and Automation', 'Biomedical Engineering', 'Textile Technology'
    ],
    "Coimbatore Institute of Technology (CIT)": ENGINEERING_DEPARTMENTS,
    "Rajalakshmi Engineering College": ENGINEERING_DEPARTMENTS,
    "St. Joseph's College of Engineering": ENGINEERING_DEPARTMENTS,
    "Meenakshi Sundararajan Engineering College": ENGINEERING_DEPARTMENTS,
    "Kumaraguru College of Technology": ENGINEERING_DEPARTMENTS,
    "Kongu Engineering College": ENGINEERING_DEPARTMENTS,
    "Bannari Amman Institute of Technology": ENGINEERING_DEPARTMENTS,
    "Other Affiliated College": ENGINEERING_DEPARTMENTS
  },
  "University of Madras": {
    "Loyola College": ARTS_SCIENCE_DEPARTMENTS,
    "Madras Christian College (MCC)": ARTS_SCIENCE_DEPARTMENTS,
    "Presidency College": ARTS_SCIENCE_DEPARTMENTS,
    "Stella Maris College": ARTS_SCIENCE_DEPARTMENTS,
    "Ethiraj College for Women": ARTS_SCIENCE_DEPARTMENTS,
    "Women's Christian College (WCC)": ARTS_SCIENCE_DEPARTMENTS,
    "Guru Nanak College": ARTS_SCIENCE_DEPARTMENTS,
    "D.G. Vaishnav College": ARTS_SCIENCE_DEPARTMENTS,
    "Pachaiyappa's College": ARTS_SCIENCE_DEPARTMENTS,
    "Justice Basheer Ahmed Sayeed College for Women (SIET)": ARTS_SCIENCE_DEPARTMENTS,
    "Other Affiliated College": ARTS_SCIENCE_DEPARTMENTS
  },
  "Bharathiar University": {
    "PSG College of Arts & Science": ARTS_SCIENCE_DEPARTMENTS,
    "Government Arts College, Coimbatore": ARTS_SCIENCE_DEPARTMENTS,
    "Sri Krishna Arts and Science College": ARTS_SCIENCE_DEPARTMENTS,
    "Kongunadu Arts and Science College": ARTS_SCIENCE_DEPARTMENTS,
    "Other Affiliated College": ARTS_SCIENCE_DEPARTMENTS
  },
  "Bharathidasan University": {
    "Bishop Heber College": ARTS_SCIENCE_DEPARTMENTS,
    "St. Joseph's College, Tiruchirappalli": ARTS_SCIENCE_DEPARTMENTS,
    "Holy Cross College": ARTS_SCIENCE_DEPARTMENTS,
    "Jamal Mohamed College": ARTS_SCIENCE_DEPARTMENTS,
    "Other Affiliated College": ARTS_SCIENCE_DEPARTMENTS
  },
  "Madurai Kamaraj University": {
    "The American College": ARTS_SCIENCE_DEPARTMENTS,
    "Lady Doak College": ARTS_SCIENCE_DEPARTMENTS,
    "Thiagarajar College": ARTS_SCIENCE_DEPARTMENTS,
    "Fatima College": ARTS_SCIENCE_DEPARTMENTS,
    "Other Affiliated College": ARTS_SCIENCE_DEPARTMENTS
  }
};

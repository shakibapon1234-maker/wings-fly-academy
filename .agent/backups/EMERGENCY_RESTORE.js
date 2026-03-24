(function () {
    const backupData = {
    "students": [
        {
            "due": 5000,
            "name": "Omor Faruk ",
            "paid": 10000,
            "batch": "18",
            "phone": "01743793385",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "Cash",
            "remarks": "",
            "studentId": "WF-18015",
            "bloodGroup": "",
            "enrollDate": "2026-01-23",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-01-23",
                    "amount": 5000,
                    "method": "Cash"
                }
            ],
            "reminderDate": "2026-01-23",
            "totalPayment": 15000
        },
        {
            "due": 8500,
            "name": "Md Ferdous Hasan",
            "paid": 9000,
            "batch": "18",
            "phone": "01717191414",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "DUTCH-BANGLA BANK LIMITED",
            "remarks": "",
            "studentId": "WF-18017",
            "bloodGroup": "",
            "enrollDate": "2026-02-08",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-02-08",
                    "amount": 4000,
                    "method": "DUTCH-BANGLA BANK LIMITED"
                }
            ],
            "reminderDate": "2026-02-08",
            "totalPayment": 17500
        },
        {
            "due": 0,
            "name": "Moriom Akter Ruma",
            "paid": 17500,
            "batch": "18",
            "phone": "01534511293",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "Cash",
            "remarks": "",
            "studentId": "WF-18016",
            "bloodGroup": "",
            "enrollDate": "2026-01-21",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-01-21",
                    "amount": 17500,
                    "method": "Cash"
                }
            ],
            "reminderDate": "2026-01-21",
            "totalPayment": 17500
        },
        {
            "due": 2000,
            "name": "Md Azizur Rahman",
            "paid": 13000,
            "batch": "18",
            "phone": "01817017920",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "Cash",
            "remarks": "",
            "studentId": "WF-18021",
            "bloodGroup": "",
            "enrollDate": "2026-01-18",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-01-18",
                    "amount": 10000,
                    "method": "Cash"
                }
            ],
            "reminderDate": "2026-01-18",
            "totalPayment": 15000
        },
        {
            "due": 11500,
            "name": "Md Saddam Hossain",
            "paid": 6000,
            "batch": "18",
            "phone": "01305512599",
            "photo": "photo_WF-18005",
            "course": "Air Ticket & Visa processing Both",
            "method": "Bikash",
            "remarks": "",
            "studentId": "WF-18005",
            "bloodGroup": "",
            "enrollDate": "2026-01-26",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-01-26",
                    "amount": 1000,
                    "method": "Bikash"
                }
            ],
            "reminderDate": null,
            "totalPayment": 17500
        },
        {
            "due": 0,
            "name": "Saida Wahida Akther",
            "paid": 17500,
            "batch": "18",
            "phone": "01627359235",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "Bikash",
            "remarks": "",
            "studentId": "WF-18013",
            "bloodGroup": "",
            "enrollDate": "2026-02-04",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-02-04",
                    "amount": 8000,
                    "method": "Bikash"
                }
            ],
            "reminderDate": "2026-02-04",
            "totalPayment": 17500
        },
        {
            "due": 5000,
            "name": "Md Al Amin",
            "paid": 5000,
            "batch": "18",
            "phone": "01721232621",
            "photo": null,
            "course": "Visa Processing",
            "method": "DUTCH-BANGLA BANK LIMITED",
            "remarks": "",
            "studentId": "WF-18019",
            "bloodGroup": "",
            "enrollDate": "2026-02-08",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-02-08",
                    "amount": 1000,
                    "method": "DUTCH-BANGLA BANK LIMITED"
                }
            ],
            "reminderDate": "2026-02-08",
            "totalPayment": 10000
        },
        {
            "due": 6000,
            "name": "Swapan Chandra Sutradhar",
            "paid": 10000,
            "batch": "18",
            "phone": "01714983798",
            "photo": "photo_WF-18006",
            "course": "Air Ticket & Visa processing Both",
            "method": "Cash",
            "remarks": "",
            "studentId": "WF-18006",
            "bloodGroup": "",
            "enrollDate": "2026-01-27",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-01-27",
                    "amount": 10000,
                    "method": "Cash"
                }
            ],
            "reminderDate": null,
            "totalPayment": 16000
        },
        {
            "due": 12500,
            "name": "Md Jahirul",
            "paid": 5000,
            "batch": "18",
            "phone": "01760736646",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "Bikash",
            "remarks": "",
            "studentId": "WF-18008",
            "bloodGroup": "",
            "enrollDate": "2026-02-06",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-02-06",
                    "amount": 2000,
                    "method": "Bikash"
                }
            ],
            "reminderDate": null,
            "totalPayment": 17500
        },
        {
            "due": 0,
            "name": "Shah Alam",
            "paid": 17500,
            "batch": "18",
            "phone": "01730937730",
            "photo": "photo_WF-18001",
            "course": "Air Ticket & Visa processing Both",
            "method": "Bikash",
            "remarks": "",
            "studentId": "WF-18001",
            "bloodGroup": "",
            "enrollDate": "2026-01-29",
            "fatherName": "Abdul Jalil",
            "motherName": "Shamima Yeasmin",
            "installments": [
                {
                    "date": "2026-01-29",
                    "amount": 7000,
                    "method": "Bikash"
                }
            ],
            "reminderDate": null,
            "totalPayment": 17500
        },
        {
            "due": 12500,
            "name": "Md Shamsul Alam Johny",
            "paid": 5000,
            "batch": "18",
            "phone": "01753049617",
            "photo": "photo_WF-18002",
            "course": "Air Ticket & Visa processing Both",
            "method": "Cash",
            "remarks": "",
            "studentId": "WF-18002",
            "bloodGroup": "",
            "enrollDate": "2026-01-29",
            "fatherName": "MD Shahjahan ",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-01-29",
                    "amount": 5000,
                    "method": "Cash"
                }
            ],
            "reminderDate": null,
            "totalPayment": 17500
        },
        {
            "due": 7000,
            "name": "Mohammad Shafiqul Islam",
            "paid": 8000,
            "batch": "18",
            "phone": "01819210394",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "Cash",
            "remarks": "",
            "studentId": "WF-18012",
            "bloodGroup": "",
            "enrollDate": "2026-01-31",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-01-31",
                    "amount": 2000,
                    "method": "Cash"
                }
            ],
            "reminderDate": "2026-01-31",
            "totalPayment": 15000
        },
        {
            "due": 12500,
            "name": "Md Abul Hashem",
            "paid": 5000,
            "batch": "18",
            "phone": "01978408811",
            "photo": "photo_WF-18004",
            "course": "Air Ticket & Visa processing Both",
            "method": "Bikash",
            "remarks": "",
            "studentId": "WF-18004",
            "bloodGroup": "",
            "enrollDate": "2026-01-26",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-01-26",
                    "amount": 1000,
                    "method": "Bikash"
                }
            ],
            "reminderDate": null,
            "totalPayment": 17500
        },
        {
            "due": 3000,
            "name": "Mohammed Tarek Hasan",
            "paid": 12000,
            "batch": "18",
            "phone": "01854359499",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "Cash",
            "remarks": "",
            "studentId": "WF-18010",
            "bloodGroup": "",
            "enrollDate": "2026-01-28",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-01-28",
                    "amount": 7000,
                    "method": "Cash"
                }
            ],
            "reminderDate": null,
            "totalPayment": 15000
        },
        {
            "due": 6000,
            "name": "Atikur Rahman",
            "paid": 8000,
            "batch": "18",
            "phone": "01712170645",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "Cash",
            "remarks": "",
            "studentId": "WF-18007",
            "bloodGroup": "",
            "enrollDate": "2026-02-20",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-02-20",
                    "amount": 8000,
                    "method": "Cash"
                }
            ],
            "reminderDate": null,
            "totalPayment": 14000
        },
        {
            "due": 10000,
            "name": "Sabuj Miah",
            "paid": 4000,
            "batch": "18",
            "phone": "01637659595",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "Cash",
            "remarks": "",
            "studentId": "WF-18011",
            "bloodGroup": "",
            "enrollDate": "2026-02-20",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-02-20",
                    "amount": 4000,
                    "method": "Cash"
                }
            ],
            "reminderDate": "2026-02-20",
            "totalPayment": 14000
        },
        {
            "due": 6000,
            "name": "Al Amin MUzumder",
            "paid": 7500,
            "batch": "18",
            "phone": "01642074870",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "Cash",
            "remarks": "",
            "studentId": "WF-18022",
            "bloodGroup": "",
            "enrollDate": "2026-01-31",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-01-31",
                    "amount": 5000,
                    "method": "Cash"
                }
            ],
            "reminderDate": null,
            "totalPayment": 13500
        },
        {
            "due": 7000,
            "name": "Aynul Khan",
            "paid": 8000,
            "batch": "18",
            "phone": "01744611501",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "Cash",
            "remarks": "",
            "studentId": "WF-18014",
            "bloodGroup": "",
            "enrollDate": "2026-02-06",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-02-06",
                    "amount": 2000,
                    "method": "Cash"
                }
            ],
            "reminderDate": "2026-02-06",
            "totalPayment": 15000
        },
        {
            "due": 9000,
            "name": "Tushar Miah",
            "paid": 1000,
            "batch": "18",
            "phone": "01909303171",
            "photo": null,
            "course": "Visa Processing",
            "method": "Bikash",
            "remarks": "",
            "studentId": "WF-18020",
            "bloodGroup": "",
            "enrollDate": "2026-01-28",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-01-28",
                    "amount": 1000,
                    "method": "Bikash"
                }
            ],
            "reminderDate": "2026-01-28",
            "totalPayment": 10000
        },
        {
            "due": 8500,
            "name": "Moh. Zainal Abedin",
            "paid": 5000,
            "batch": "18",
            "phone": "01602784581",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "Cash",
            "remarks": "",
            "studentId": "WF-18026",
            "bloodGroup": "",
            "enrollDate": "2026-01-31",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-01-31",
                    "amount": 5000,
                    "method": "Cash"
                }
            ],
            "reminderDate": "2026-01-31",
            "totalPayment": 13500
        },
        {
            "due": 12000,
            "name": "Masuk Al Hossain",
            "paid": 3000,
            "batch": "18",
            "phone": "01733580871",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "Cash",
            "remarks": "",
            "studentId": "WF-18027",
            "bloodGroup": "",
            "enrollDate": "2026-02-19",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-02-19",
                    "amount": 3000,
                    "method": "Cash"
                }
            ],
            "reminderDate": "2026-02-19",
            "totalPayment": 15000
        },
        {
            "due": 14000,
            "name": "Biplob Hossain",
            "paid": 2000,
            "batch": "18",
            "phone": "01944535102",
            "photo": null,
            "course": "Air Ticket & Visa processing Both",
            "method": "DUTCH-BANGLA BANK LIMITED",
            "remarks": "",
            "studentId": "WF-18028",
            "bloodGroup": "",
            "enrollDate": "2026-01-28",
            "fatherName": "",
            "motherName": "",
            "installments": [
                {
                    "date": "2026-01-28",
                    "amount": 2000,
                    "method": "DUTCH-BANGLA BANK LIMITED"
                }
            ],
            "reminderDate": "2026-01-28",
            "totalPayment": 16000
        }
    ],
    "employees": [
        {
            "id": "EMP-1771771267467",
            "name": "Shakib Ibna Mustafa",
            "role": "Manager",
            "email": "shakibapon1234@gmail.com",
            "phone": "01674091748",
            "salary": 30000,
            "status": "Active",
            "resignDate": null,
            "joiningDate": "2020-03-01",
            "lastUpdated": "2026-02-22T14:42:46.536Z"
        },
        {
            "id": "EMP-1771771352056",
            "name": "Md Biplob Biswas",
            "role": "Staff",
            "email": "biplob4695@gmail.com",
            "phone": "01790674695",
            "salary": 14000,
            "status": "Active",
            "resignDate": null,
            "joiningDate": "2022-11-01",
            "lastUpdated": "2026-02-22T14:42:32.056Z"
        },
        {
            "id": "EMP-1773135342737",
            "name": "Sathi Akter",
            "role": "Staff",
            "email": "",
            "phone": "01631448130",
            "salary": 12000,
            "status": "Active",
            "resignDate": null,
            "joiningDate": "2025-12-12",
            "lastUpdated": "2026-03-10T09:35:42.737Z"
        },
        {
            "id": "EMP-1773135423951",
            "name": "Nazmul Karim",
            "role": "Staff",
            "email": "",
            "phone": "01326763186",
            "salary": 12000,
            "status": "Active",
            "resignDate": null,
            "joiningDate": "2026-12-02",
            "lastUpdated": "2026-03-10T09:37:03.951Z"
        },
        {
            "id": "EMP-1773135509119",
            "name": "Taslim S Tamanna",
            "role": "Staff",
            "email": "",
            "phone": "01822394500",
            "salary": 10000,
            "status": "Active",
            "resignDate": null,
            "joiningDate": "2025-01-08",
            "lastUpdated": "2026-03-10T09:38:29.119Z"
        }
    ],
    "finance": [
        {
            "id": "REC_Shah_Alam_0_1771682442137",
            "date": "2026-01-29",
            "type": "Income",
            "amount": 7000,
            "method": "Bikash",
            "person": "Shah Alam",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.137Z",
            "description": "Installment payment for student: Shah Alam | Batch: 18"
        },
        {
            "id": "REC_Md_Shamsul_Alam_Johny_0_1771682442138",
            "date": "2026-01-29",
            "type": "Income",
            "amount": 5000,
            "method": "Cash",
            "person": "Md Shamsul Alam Johny",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.138Z",
            "description": "Installment payment for student: Md Shamsul Alam Johny | Batch: 18"
        },
        {
            "id": "REC_Md_Abul_Hashem_0_1771682442139",
            "date": "2026-01-26",
            "type": "Income",
            "amount": 1000,
            "method": "Bikash",
            "person": "Md Abul Hashem",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Md Abul Hashem | Batch: 18"
        },
        {
            "id": "REC_Md_Saddam_Hossain_0_1771682442139",
            "date": "2026-01-26",
            "type": "Income",
            "amount": 1000,
            "method": "Bikash",
            "person": "Md Saddam Hossain",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Md Saddam Hossain | Batch: 18"
        },
        {
            "id": "REC_Swapan_Chandra_Sutradhar_0_1771682442139",
            "date": "2026-01-27",
            "type": "Income",
            "amount": 10000,
            "method": "Cash",
            "person": "Swapan Chandra Sutradhar",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Swapan Chandra Sutradhar | Batch: 18"
        },
        {
            "id": "REC_Atikur_Rahman_0_1771682442139",
            "date": "2026-02-20",
            "type": "Income",
            "amount": 8000,
            "method": "Cash",
            "person": "Atikur Rahman",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Atikur Rahman | Batch: 18"
        },
        {
            "id": "REC_Md_Jahirul_0_1771682442139",
            "date": "2026-02-06",
            "type": "Income",
            "amount": 2000,
            "method": "Bikash",
            "person": "Md Jahirul",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Md Jahirul | Batch: 18"
        },
        {
            "id": "REC_Mohammed_Tarek_Hasan_0_1771682442139",
            "date": "2026-01-28",
            "type": "Income",
            "amount": 7000,
            "method": "Cash",
            "person": "Mohammed Tarek Hasan",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Mohammed Tarek Hasan | Batch: 18"
        },
        {
            "id": "REC_Sabuj_Miah_0_1771682442139",
            "date": "2026-02-20",
            "type": "Income",
            "amount": 4000,
            "method": "Cash",
            "person": "Sabuj Miah",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Sabuj Miah | Batch: 18"
        },
        {
            "id": "REC_Mohammad_Shafiqul_Islam_0_1771682442139",
            "date": "2026-01-31",
            "type": "Income",
            "amount": 2000,
            "method": "Cash",
            "person": "Mohammad Shafiqul Islam",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Mohammad Shafiqul Islam | Batch: 18"
        },
        {
            "id": "REC_Saida_Wahida_Akther_0_1771682442139",
            "date": "2026-02-04",
            "type": "Income",
            "amount": 8000,
            "method": "Bikash",
            "person": "Saida Wahida Akther",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Saida Wahida Akther | Batch: 18"
        },
        {
            "id": "REC_Aynul_Khan_0_1771682442139",
            "date": "2026-02-06",
            "type": "Income",
            "amount": 2000,
            "method": "Cash",
            "person": "Aynul Khan",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Aynul Khan | Batch: 18"
        },
        {
            "id": "REC_Omor_Faruk__0_1771682442139",
            "date": "2026-01-23",
            "type": "Income",
            "amount": 5000,
            "method": "Cash",
            "person": "Omor Faruk ",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Omor Faruk  | Batch: 18"
        },
        {
            "id": "REC_Moriom_Akter_Ruma_0_1771682442139",
            "date": "2026-01-21",
            "type": "Income",
            "amount": 17500,
            "method": "Cash",
            "person": "Moriom Akter Ruma",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Moriom Akter Ruma | Batch: 18"
        },
        {
            "id": "REC_Md_Ferdous_Hasan_0_1771682442139",
            "date": "2026-02-08",
            "type": "Income",
            "amount": 4000,
            "method": "DUTCH-BANGLA BANK LIMITED",
            "person": "Md Ferdous Hasan",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Md Ferdous Hasan | Batch: 18"
        },
        {
            "id": "REC_Md_Al_Amin_0_1771682442139",
            "date": "2026-02-08",
            "type": "Income",
            "amount": 1000,
            "method": "DUTCH-BANGLA BANK LIMITED",
            "person": "Md Al Amin",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Md Al Amin | Batch: 18"
        },
        {
            "id": "REC_Tushar_Miah_0_1771682442139",
            "date": "2026-01-28",
            "type": "Income",
            "amount": 1000,
            "method": "Bikash",
            "person": "Tushar Miah",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Tushar Miah | Batch: 18"
        },
        {
            "id": "REC_Md_Azizur_Rahman_0_1771682442139",
            "date": "2026-01-18",
            "type": "Income",
            "amount": 10000,
            "method": "Cash",
            "person": "Md Azizur Rahman",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Md Azizur Rahman | Batch: 18"
        },
        {
            "id": "REC_Al_Amin_MUzumder_0_1771682442139",
            "date": "2026-01-31",
            "type": "Income",
            "amount": 5000,
            "method": "Cash",
            "person": "Al Amin MUzumder",
            "category": "Student Installment",
            "recovered": true,
            "studentId": null,
            "timestamp": "2026-02-21T14:00:42.139Z",
            "description": "Installment payment for student: Al Amin MUzumder | Batch: 18"
        },
        {
            "id": 1771913749914,
            "date": "2026-02-24",
            "type": "Expense",
            "amount": 800,
            "method": "Cash",
            "person": "",
            "category": "Other",
            "description": "For Reaper Gas (iftari)"
        },
        {
            "id": 1772539167397,
            "date": "2026-03-03",
            "type": "Expense",
            "amount": 500,
            "method": "Cash",
            "person": "",
            "category": "Other",
            "description": "A4 aer"
        },
        {
            "id": 1772950757104,
            "date": "2026-02-08",
            "type": "Expense",
            "amount": 30000,
            "method": "Cash",
            "person": "",
            "category": "Salary Shakib",
            "description": "Salary+home Rent"
        },
        {
            "id": 1772951015414,
            "date": "2026-02-08",
            "type": "Expense",
            "amount": 13000,
            "method": "Cash",
            "person": "",
            "category": "Salary Mobarak",
            "description": ""
        },
        {
            "id": 1772951153416,
            "date": "2026-02-08",
            "type": "Expense",
            "amount": 20000,
            "method": "Bikash",
            "person": "",
            "category": "Salary Kayum",
            "description": ""
        },
        {
            "id": 1772951227205,
            "date": "2026-02-08",
            "type": "Expense",
            "amount": 10000,
            "method": "Cash",
            "person": "",
            "category": "Salary Tamanna",
            "description": ""
        },
        {
            "id": 1772951289228,
            "date": "2026-02-08",
            "type": "Expense",
            "amount": 14000,
            "method": "Cash",
            "person": "",
            "category": "Salary Biplob",
            "description": ""
        },
        {
            "id": 1772951366037,
            "date": "2026-03-08",
            "type": "Expense",
            "amount": 4000,
            "method": "Cash",
            "person": "",
            "category": "Utilities",
            "description": "Internet Bill"
        },
        {
            "id": 1772951417069,
            "date": "2026-02-08",
            "type": "Expense",
            "amount": 1800,
            "method": "Cash",
            "person": "",
            "category": "Utilities",
            "description": "Water Bill"
        },
        {
            "id": 1772952867381,
            "date": "2026-03-08",
            "type": "Income",
            "amount": 6000,
            "method": "Cash",
            "person": "Aynul Khan",
            "category": "Student Installment",
            "timestamp": "2026-03-08T06:54:27.381Z",
            "description": "Installment payment for student: Aynul Khan | Batch: 18"
        },
        {
            "id": 1772957646400,
            "date": "2026-03-08",
            "type": "Income",
            "amount": 2500,
            "method": "Cash",
            "person": "Al Amin MUzumder",
            "category": "Student Installment",
            "timestamp": "2026-03-08T08:14:06.400Z",
            "description": "Installment payment for student: Al Amin MUzumder | Batch: 18"
        },
        {
            "id": 1772958733401,
            "date": "2026-03-08",
            "type": "Income",
            "amount": 5000,
            "method": "Cash",
            "person": "Mohammed Tarek Hasan",
            "category": "Student Installment",
            "timestamp": "2026-03-08T08:32:13.401Z",
            "description": "Installment payment for student: Mohammed Tarek Hasan | Batch: 18"
        },
        {
            "id": 1772958827616,
            "date": "2026-03-08",
            "type": "Income",
            "amount": 4000,
            "method": "Bikash",
            "person": "Md Abul Hashem",
            "category": "Student Installment",
            "timestamp": "2026-03-08T08:33:47.616Z",
            "description": "Installment payment for student: Md Abul Hashem | Batch: 18"
        },
        {
            "id": 1772958892979,
            "date": "2026-03-08",
            "type": "Income",
            "amount": 6000,
            "method": "Cash",
            "person": "Mohammad Shafiqul Islam",
            "category": "Student Installment",
            "timestamp": "2026-03-08T08:34:52.979Z",
            "description": "Installment payment for student: Mohammad Shafiqul Islam | Batch: 18"
        },
        {
            "id": 1772959445033,
            "date": "2026-03-08",
            "type": "Income",
            "amount": 3000,
            "method": "Bikash",
            "person": "Md Jahirul",
            "category": "Student Installment",
            "timestamp": "2026-03-08T08:44:05.033Z",
            "description": "Installment payment for student: Md Jahirul | Batch: 18"
        },
        {
            "id": 1772959765762,
            "date": "2026-03-08",
            "type": "Income",
            "amount": 4000,
            "method": "Bikash",
            "person": "Md Al Amin",
            "category": "Student Installment",
            "timestamp": "2026-03-08T08:49:25.762Z",
            "description": "Installment payment for student: Md Al Amin | Batch: 18"
        },
        {
            "id": 1772959908216,
            "date": "2026-03-08",
            "type": "Income",
            "amount": 9500,
            "method": "Cash",
            "person": "Saida Wahida Akther",
            "category": "Student Installment",
            "timestamp": "2026-03-08T08:51:48.216Z",
            "description": "Installment payment for student: Saida Wahida Akther | Batch: 18"
        },
        {
            "id": 1772960047121,
            "date": "2026-03-08",
            "type": "Income",
            "amount": 5000,
            "method": "Cash",
            "person": "Md Saddam Hossain",
            "category": "Student Installment",
            "timestamp": "2026-03-08T08:54:07.121Z",
            "description": "Installment payment for student: Md Saddam Hossain | Batch: 18"
        },
        {
            "id": 1772960166100,
            "date": "2026-03-08",
            "type": "Income",
            "amount": 3000,
            "method": "Cash",
            "person": "Md Azizur Rahman",
            "category": "Student Installment",
            "timestamp": "2026-03-08T08:56:06.100Z",
            "description": "Installment payment for student: Md Azizur Rahman | Batch: 18"
        },
        {
            "id": 1772960313097,
            "date": "2026-03-08",
            "type": "Income",
            "amount": 5000,
            "method": "DUTCH-BANGLA BANK LIMITED",
            "person": "Md Ferdous Hasan",
            "category": "Student Installment",
            "timestamp": "2026-03-08T08:58:33.097Z",
            "description": "Installment payment for student: Md Ferdous Hasan | Batch: 18"
        },
        {
            "id": 1772960376250,
            "date": "2026-03-08",
            "type": "Income",
            "amount": 5000,
            "method": "Cash",
            "person": "Omor Faruk ",
            "category": "Student Installment",
            "timestamp": "2026-03-08T08:59:36.250Z",
            "description": "Installment payment for student: Omor Faruk  | Batch: 18"
        },
        {
            "id": "FIN-1772960567304-0",
            "date": "2026-01-31",
            "type": "Income",
            "amount": 5000,
            "method": "Cash",
            "person": "Moh. Zainal Abedin",
            "category": "Student Fee",
            "studentId": "WF-18026",
            "timestamp": "2026-03-08T09:02:43.027Z",
            "description": "Enrollment fee for student: Moh. Zainal Abedin | ID: WF-18026 | Batch: 18"
        },
        {
            "id": "FIN-1772960797701-1",
            "date": "2026-02-19",
            "type": "Income",
            "amount": 3000,
            "method": "Cash",
            "person": "Masuk Al Hossain",
            "category": "Student Fee",
            "studentId": "WF-18027",
            "timestamp": "2026-03-08T09:06:30.162Z",
            "description": "Enrollment fee for student: Masuk Al Hossain | ID: WF-18027 | Batch: 18"
        },
        {
            "id": "FIN-1772961025283-0",
            "date": "2026-01-28",
            "type": "Income",
            "amount": 2000,
            "method": "DUTCH-BANGLA BANK LIMITED",
            "person": "Biplob Hossain",
            "category": "Student Fee",
            "studentId": "WF-18028",
            "timestamp": "2026-03-08T09:10:22.979Z",
            "description": "Enrollment fee for student: Biplob Hossain | ID: WF-18028 | Batch: 18"
        },
        {
            "id": 1773037900013,
            "date": "2026-03-09",
            "type": "Income",
            "amount": 10500,
            "method": "Cash",
            "person": "Shah Alam",
            "category": "Student Installment",
            "timestamp": "2026-03-09T06:31:40.013Z",
            "description": "Installment payment for student: Shah Alam | Batch: 18"
        },
        {
            "id": 1773118946154,
            "date": "2026-02-06",
            "type": "Expense",
            "amount": 900,
            "method": "Cash",
            "person": "",
            "category": "Other",
            "createdAt": "2026-03-10T05:02:26.154Z",
            "timestamp": "2026-03-10T05:02:26.154Z",
            "updatedAt": "2026-03-10T05:02:26.154Z",
            "description": "Seminar Nasta"
        },
        {
            "id": 1773119539285,
            "type": "Expense",
            "method": "Cash",
            "date": "2026-02-28",
            "amount": 6300,
            "category": "Salary",
            "description": "Other Ex..From : 1st Feb To 31Feb",
            "person": ""
        },
        {
            "id": 1773119629487,
            "type": "Expense",
            "method": "Cash",
            "date": "2026-03-10",
            "amount": 14200,
            "category": "Salary",
            "description": "Iftari Till Today",
            "person": ""
        },
        {
            "id": 1773119756102,
            "type": "Expense",
            "method": "Cash",
            "date": "2026-03-07",
            "amount": 4000,
            "category": "Salary",
            "description": "Internet Bill",
            "person": ""
        },
        {
            "id": 1773119928930,
            "type": "Expense",
            "method": "Cash",
            "date": "2026-03-03",
            "amount": 9500,
            "category": "Salary",
            "description": "Khabar Bill Total Month Of Feb 26",
            "person": ""
        },
        {
            "id": 1773136213332,
            "date": "2026-03-10",
            "type": "Loan Received",
            "amount": 91000,
            "method": "Cash",
            "person": "FERDOUS FOR SALARY MONTH OF MARCH 26/B-18",
            "category": "Loan",
            "description": ""
        },
        {
            "id": 1773136307677,
            "date": "2026-03-10",
            "type": "Expense",
            "amount": 16000,
            "method": "Cash",
            "person": "",
            "category": "Salary",
            "description": ""
        }
    ],
    "settings": {
        "academyName": "Wings Fly Aviation Academy",
        "dailyBackups": [
            {
                "date": "2026-03-03",
                "finance": 26,
                "students": 22,
                "employees": 2,
                "timestamp": "2026-03-03T07:29:10.037Z"
            },
            {
                "date": "2026-03-03",
                "finance": 26,
                "students": 22,
                "employees": 2,
                "timestamp": "2026-03-03T07:16:15.016Z"
            },
            {
                "date": "2026-03-02",
                "finance": 26,
                "students": 22,
                "employees": 2,
                "timestamp": "2026-03-02T10:40:33.807Z"
            },
            {
                "date": "2026-02-26",
                "finance": 26,
                "students": 22,
                "employees": 2,
                "timestamp": "2026-02-26T17:40:44.944Z"
            },
            {
                "date": "2026-02-26",
                "finance": 26,
                "students": 22,
                "employees": 2,
                "timestamp": "2026-02-26T16:34:24.764Z"
            },
            {
                "date": "2026-02-26",
                "finance": 26,
                "students": 22,
                "employees": 2,
                "timestamp": "2026-02-26T15:04:58.446Z"
            }
        ],
        "adminUsername": "admin",
        "monthlyTarget": 200000,
        "startBalances": {
            "Cash": 0,
            "Bikash": 0,
            "Brac Bank": 0,
            "CITY BANK": 0,
            "DUTCH-BANGLA BANK LIMITED": 0
        },
        "recoveryAnswer": "81d204888ca68076d77ce3c4f2fa1d5798706ca17cca075462165942c9144145",
        "recoveryQuestion": "wife name",
        "autoLockoutMinutes": 0,
        "runningBatch": "18",
        "runningBatchDateStart": "",
        "runningBatchDateEnd": ""
    },
    "incomeCategories": [
        "Incentive",
        "Loan",
        "Loan Received",
        "Other",
        "Student Fee",
        "Student Installment"
    ],
    "expenseCategories": [
        "Loan Given",
        "Other",
        "Rent",
        "Salary",
        "Salary Biplob",
        "Salary Kayum",
        "Salary Mobarak",
        "Salary Shakib",
        "Salary Tamanna",
        "Utilities"
    ],
    "paymentMethods": [
        "Cash",
        "Bkash",
        "Nagad",
        "Bank Transfer",
        "CITY BANK",
        "DUTCH-BANGLA BANK LIMITED",
        "Brac Bank",
        "Bikash"
    ],
    "cashBalance": 102000,
    "bankAccounts": [
        {
            "sl": 1,
            "name": "CITY BANK",
            "branch": "BONOSREE",
            "balance": 0,
            "bankName": "CITY BANK",
            "accountNo": "1493888742001"
        },
        {
            "sl": 2,
            "name": "DUTCH-BANGLA BANK LIMITED",
            "branch": "Rampura",
            "balance": 12000,
            "bankName": "Wings Fly",
            "accountNo": "1781100023959"
        },
        {
            "sl": 3,
            "name": "Brac Bank",
            "branch": "Bonosree",
            "balance": 0,
            "bankName": "Wings Fly",
            "accountNo": "2052189750001"
        }
    ],
    "mobileBanking": [
        {
            "sl": 1,
            "name": "Bikash",
            "balance": 11000,
            "accountNo": "4544754"
        }
    ],
    "courseNames": [
        "Air Ticket & Visa processing Both",
        "Air Ticketing",
        "Caregiver",
        "Student Visa",
        "TICTB Exam",
        "Visa Processing"
    ],
    "attendance": {
        "18_2026-02-19": {
            "WF-18001": "Absent",
            "WF-18002": "Absent",
            "WF-18003": "Present",
            "WF-18004": "Present",
            "WF-18005": "Present",
            "WF-18006": "Present"
        },
        "18_2026-02-20": {
            "WF-18001": "Present",
            "WF-18002": "Present",
            "WF-18003": "Present",
            "WF-18004": "Present",
            "WF-18005": "Present",
            "WF-18006": "Present"
        },
        "18_2026-02-21": {
            "WF-18001": "Present",
            "WF-18002": "Present",
            "WF-18003": "Present",
            "WF-18004": "Present",
            "WF-18005": "Present",
            "WF-18006": "Present",
            "WF-18007": "Present",
            "WF-18008": "Present",
            "WF-18009": "Present",
            "WF-18010": "Present",
            "WF-18011": "Present",
            "WF-18012": "Present",
            "WF-18013": "Present",
            "WF-18014": "Present",
            "WF-18015": "Present",
            "WF-18016": "Present",
            "WF-18017": "Present",
            "WF-18018": "Present",
            "WF-18019": "Present",
            "WF-18020": "Present",
            "WF-18021": "Present",
            "WF-18022": "Present"
        }
    },
    "nextId": 1001,
    "users": [
        {
            "name": "Admin",
            "role": "admin",
            "password": "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
            "username": "admin"
        },
        {
            "name": "mobarak",
            "role": "subid",
            "password": "a69005db3cf34a15c2c9d6b945f95f389f12723c6763749eb6b81df4665a4f29",
            "username": "mobarak"
        }
    ],
    "examRegistrations": [],
    "visitors": [],
    "employeeRoles": [
        "Admin",
        "Instructor",
        "Manager",
        "Staff"
    ],
    "deletedItems": [
        {
            "id": "TRASH_1773866305675_K1ETK",
            "type": "student",
            "item": {
                "name": "shakib",
                "phone": "6666666666",
                "fatherName": "",
                "motherName": "",
                "bloodGroup": "AB+",
                "course": "Student Visa",
                "batch": "5",
                "enrollDate": "2026-03-18",
                "method": "Bikash",
                "totalPayment": 5555,
                "paid": 555,
                "due": 5000,
                "reminderDate": "2026-03-19",
                "studentId": "WF-5005",
                "remarks": "",
                "photo": null,
                "installments": [
                    {
                        "amount": 555,
                        "date": "2026-03-18",
                        "method": "Bikash"
                    }
                ],
                "_trash_tmp_id": "TMP_1773866305675_DTD2D"
            },
            "deletedAt": "2026-03-18T20:38:25.675Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1773071245679_6ZO09",
            "item": {
                "id": 1773067893668.041,
                "date": "2026-03-09",
                "type": "Income",
                "amount": 5000,
                "method": "Cash",
                "person": "__TEST__ EDITED Student",
                "category": "Student Installment",
                "timestamp": "2026-03-09T14:51:33.668Z",
                "description": "Restored installment for student: __TEST__ EDITED Student | Batch: 99"
            },
            "type": "finance",
            "deletedAt": "2026-03-09T15:47:25.679Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1773071245648_3PW3K",
            "item": {
                "id": 1773067893668.041,
                "date": "2026-03-09",
                "type": "Income",
                "amount": 5000,
                "method": "Cash",
                "person": "__TEST__ EDITED Student",
                "category": "Student Installment",
                "timestamp": "2026-03-09T14:51:33.668Z",
                "description": "Restored installment for student: __TEST__ EDITED Student | Batch: 99"
            },
            "type": "Finance",
            "deletedAt": "2026-03-09T15:47:25.648Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1773071244531_F9BEC",
            "item": {
                "id": 1773067893668.041,
                "date": "2026-03-09",
                "type": "Income",
                "amount": 5000,
                "method": "Cash",
                "person": "__TEST__ EDITED Student",
                "category": "Student Installment",
                "timestamp": "2026-03-09T14:51:33.668Z",
                "description": "Restored installment for student: __TEST__ EDITED Student | Batch: 99"
            },
            "type": "Finance",
            "deletedAt": "2026-03-09T15:47:24.531Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1773071145068_ME7SW",
            "item": {
                "id": "48d36d61-1d93-4051-8092-684da6c83edd",
                "due": 10000,
                "name": "__TEST__ EDITED Student",
                "paid": 0,
                "batch": "99",
                "phone": "01700000000",
                "course": "CPL",
                "remarks": "Auto Test — Safe to delete",
                "studentId": "TEST-1773067892557",
                "enrollDate": "2026-03-09",
                "totalPayment": 10000
            },
            "type": "student",
            "deletedAt": "2026-03-09T15:45:45.068Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1773071140655_XOV7O",
            "item": {
                "id": "48d36d61-1d93-4051-8092-684da6c83edd",
                "due": 5000,
                "name": "__TEST__ EDITED Student",
                "paid": 5000,
                "batch": "99",
                "phone": "01700000000",
                "course": "CPL",
                "remarks": "Auto Test — Safe to delete",
                "studentId": "WF-99001",
                "enrollDate": "2026-03-09",
                "totalPayment": 10000
            },
            "type": "student",
            "deletedAt": "2026-03-09T15:45:40.655Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772987410808_7932",
            "item": {
                "id": "note_1772987397999",
                "tag": "k",
                "date": "2026-03-08",
                "title": "jk",
                "content": "kjnkjn",
                "createdAt": "2026-03-08T16:29:57.999Z"
            },
            "type": "keeprecord",
            "deletedAt": "2026-03-08T16:30:10.808Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772974137617_3217",
            "item": {
                "id": "note_1772974131470",
                "tag": "",
                "date": "2026-03-08",
                "title": "",
                "content": "nkmk",
                "createdAt": "2026-03-08T12:48:51.470Z"
            },
            "type": "keeprecord",
            "deletedAt": "2026-03-08T12:48:57.617Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954960104_SBNVD",
            "item": {
                "id": 1772954119173,
                "date": "2026-03-08",
                "type": "Income",
                "amount": 555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Installment",
                "timestamp": "2026-03-08T07:15:19.173Z",
                "description": "Installment payment for student: shakib | Batch: "
            },
            "type": "finance",
            "deletedAt": "2026-03-08T07:29:20.104Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954960093_UCWRM",
            "item": {
                "id": 1772954119173,
                "date": "2026-03-08",
                "type": "Income",
                "amount": 555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Installment",
                "timestamp": "2026-03-08T07:15:19.173Z",
                "description": "Installment payment for student: shakib | Batch: "
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T07:29:20.093Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954958010_D1LU5",
            "item": {
                "id": 1772954119173,
                "date": "2026-03-08",
                "type": "Income",
                "amount": 555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Installment",
                "timestamp": "2026-03-08T07:15:19.173Z",
                "description": "Installment payment for student: shakib | Batch: "
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T07:29:18.010Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954252960_T8FIC",
            "item": {
                "due": 66666,
                "name": "shakib",
                "paid": 0,
                "batch": "",
                "phone": "01757208244",
                "photo": null,
                "course": "Student Visa",
                "method": "CITY BANK",
                "remarks": "",
                "studentId": "WF-00001",
                "bloodGroup": "B-",
                "enrollDate": "2026-03-08",
                "fatherName": "sfsf",
                "motherName": "",
                "installments": [],
                "reminderDate": null,
                "totalPayment": 66666,
                "_trash_tmp_id": "TMP_1772954252960_8X7VK"
            },
            "type": "student",
            "deletedAt": "2026-03-08T07:17:32.961Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954252933_Z5E1Y",
            "item": {
                "id": "FIN-1772954095627-0",
                "date": "2026-03-08",
                "type": "Income",
                "amount": 5555,
                "method": "CITY BANK",
                "person": "shakib",
                "category": "Student Fee",
                "studentId": "WF-00001",
                "timestamp": "2026-03-08T07:14:54.823Z",
                "description": "Enrollment fee for student: shakib | ID: WF-00001 | Batch: "
            },
            "type": "finance",
            "deletedAt": "2026-03-08T07:17:32.933Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954252912_FH6CW",
            "item": {
                "id": "FIN-1772954095627-0",
                "date": "2026-03-08",
                "type": "Income",
                "amount": 5555,
                "method": "CITY BANK",
                "person": "shakib",
                "category": "Student Fee",
                "studentId": "WF-00001",
                "timestamp": "2026-03-08T07:14:54.823Z",
                "description": "Enrollment fee for student: shakib | ID: WF-00001 | Batch: "
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T07:17:32.912Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954251628_1UWUS",
            "item": {
                "id": "FIN-1772954095627-0",
                "date": "2026-03-08",
                "type": "Income",
                "amount": 5555,
                "method": "CITY BANK",
                "person": "shakib",
                "category": "Student Fee",
                "studentId": "WF-00001",
                "timestamp": "2026-03-08T07:14:54.823Z",
                "description": "Enrollment fee for student: shakib | ID: WF-00001 | Batch: "
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T07:17:31.628Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954128317_6CEMK",
            "item": {
                "date": "2026-03-08",
                "amount": 555,
                "method": "Cash",
                "studentName": "shakib",
                "_trash_tmp_id": "TMP_1772954128317_V81LY"
            },
            "type": "installment",
            "deletedAt": "2026-03-08T07:15:28.317Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954128293_1Q7C6",
            "item": {
                "date": "2026-03-08",
                "batch": "",
                "amount": 555,
                "method": "Cash",
                "description": "Installment: ৳555 | shakib | 2026-03-08",
                "studentName": "shakib",
                "studentIndex": 19,
                "_trash_tmp_id": "TMP_1772954128293_0556Y"
            },
            "type": "installment",
            "deletedAt": "2026-03-08T07:15:28.293Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954010337_AP7QZ",
            "item": {
                "id": "REC_Biplob_Hossain_0_1771682442138",
                "date": "2026-01-28",
                "type": "Income",
                "amount": 2000,
                "method": "DUTCH-BANGLA BANK LIMITED",
                "person": "Biplob Hossain",
                "category": "Student Installment",
                "recovered": true,
                "studentId": null,
                "timestamp": "2026-02-21T14:00:42.138Z",
                "description": "Installment payment for student: Biplob Hossain | Batch: 18"
            },
            "type": "finance",
            "deletedAt": "2026-03-08T07:13:30.337Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954010311_SIJGQ",
            "item": {
                "id": "REC_Biplob_Hossain_0_1771682442138",
                "date": "2026-01-28",
                "type": "Income",
                "amount": 2000,
                "method": "DUTCH-BANGLA BANK LIMITED",
                "person": "Biplob Hossain",
                "category": "Student Installment",
                "recovered": true,
                "studentId": null,
                "timestamp": "2026-02-21T14:00:42.138Z",
                "description": "Installment payment for student: Biplob Hossain | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T07:13:30.311Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954009229_4DPWN",
            "item": {
                "id": "REC_Biplob_Hossain_0_1771682442138",
                "date": "2026-01-28",
                "type": "Income",
                "amount": 2000,
                "method": "DUTCH-BANGLA BANK LIMITED",
                "person": "Biplob Hossain",
                "category": "Student Installment",
                "recovered": true,
                "studentId": null,
                "timestamp": "2026-02-21T14:00:42.138Z",
                "description": "Installment payment for student: Biplob Hossain | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T07:13:29.229Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954005305_J5GBL",
            "item": {
                "id": "REC_Biplob_Hossain_1_1771682442139",
                "date": "2026-02-21",
                "type": "Income",
                "amount": 6000,
                "method": "Cash",
                "person": "Biplob Hossain",
                "category": "Student Installment",
                "recovered": true,
                "studentId": null,
                "timestamp": "2026-02-21T14:00:42.139Z",
                "description": "Installment payment for student: Biplob Hossain | Batch: 18"
            },
            "type": "finance",
            "deletedAt": "2026-03-08T07:13:25.305Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954005272_G47CN",
            "item": {
                "id": "REC_Biplob_Hossain_1_1771682442139",
                "date": "2026-02-21",
                "type": "Income",
                "amount": 6000,
                "method": "Cash",
                "person": "Biplob Hossain",
                "category": "Student Installment",
                "recovered": true,
                "studentId": null,
                "timestamp": "2026-02-21T14:00:42.139Z",
                "description": "Installment payment for student: Biplob Hossain | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T07:13:25.272Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772954003999_SRTO1",
            "item": {
                "id": "REC_Biplob_Hossain_1_1771682442139",
                "date": "2026-02-21",
                "type": "Income",
                "amount": 6000,
                "method": "Cash",
                "person": "Biplob Hossain",
                "category": "Student Installment",
                "recovered": true,
                "studentId": null,
                "timestamp": "2026-02-21T14:00:42.139Z",
                "description": "Installment payment for student: Biplob Hossain | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T07:13:23.999Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772953999101_BGDB2",
            "item": {
                "id": "FIN-1772953360269-0",
                "date": "2026-01-28",
                "type": "Income",
                "amount": 2000,
                "method": "DUTCH-BANGLA BANK LIMITED",
                "person": "Biplob Hossain",
                "category": "Student Fee",
                "studentId": "WF-18025",
                "timestamp": "2026-03-08T07:02:04.664Z",
                "description": "Enrollment fee for student: Biplob Hossain | ID: WF-18025 | Batch: 18"
            },
            "type": "finance",
            "deletedAt": "2026-03-08T07:13:19.101Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772953999020_Z876N",
            "item": {
                "id": "FIN-1772953360269-0",
                "date": "2026-01-28",
                "type": "Income",
                "amount": 2000,
                "method": "DUTCH-BANGLA BANK LIMITED",
                "person": "Biplob Hossain",
                "category": "Student Fee",
                "studentId": "WF-18025",
                "timestamp": "2026-03-08T07:02:04.664Z",
                "description": "Enrollment fee for student: Biplob Hossain | ID: WF-18025 | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T07:13:19.020Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772953997871_14Y5I",
            "item": {
                "id": "FIN-1772953360269-0",
                "date": "2026-01-28",
                "type": "Income",
                "amount": 2000,
                "method": "DUTCH-BANGLA BANK LIMITED",
                "person": "Biplob Hossain",
                "category": "Student Fee",
                "studentId": "WF-18025",
                "timestamp": "2026-03-08T07:02:04.664Z",
                "description": "Enrollment fee for student: Biplob Hossain | ID: WF-18025 | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T07:13:17.871Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772953661370_HGYDZ",
            "item": {
                "due": 6000,
                "name": "Biplob Hossain",
                "paid": 10000,
                "batch": "18",
                "phone": "01944535102",
                "photo": null,
                "course": "Air Ticket & Visa processing Both",
                "method": "DUTCH-BANGLA BANK LIMITED",
                "remarks": "",
                "studentId": "WF-18025",
                "bloodGroup": "",
                "enrollDate": "2026-01-28",
                "fatherName": "",
                "motherName": "",
                "installments": [
                    {
                        "date": "2026-01-28",
                        "amount": 2000,
                        "method": "DUTCH-BANGLA BANK LIMITED"
                    },
                    {
                        "date": "2026-03-08",
                        "amount": 6000,
                        "method": "Bikash"
                    }
                ],
                "reminderDate": "2026-03-06",
                "totalPayment": 16000,
                "_trash_tmp_id": "TMP_1772953661370_7J5N9"
            },
            "type": "student",
            "deletedAt": "2026-03-08T07:07:41.370Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772953179312_6EVTY",
            "item": {
                "due": 9500,
                "name": "Biplob Hossain",
                "paid": 8000,
                "batch": "18",
                "phone": "01944535102",
                "photo": null,
                "course": "Air Ticket & Visa processing Both",
                "method": "DUTCH-BANGLA BANK LIMITED",
                "remarks": "",
                "studentId": "WF-18003",
                "bloodGroup": "",
                "enrollDate": "2026-01-28",
                "fatherName": "",
                "motherName": "",
                "installments": [
                    {
                        "date": "2026-01-28",
                        "amount": 2000,
                        "method": "DUTCH-BANGLA BANK LIMITED"
                    },
                    {
                        "date": "2026-02-21",
                        "amount": 6000,
                        "method": "Cash"
                    }
                ],
                "reminderDate": null,
                "totalPayment": 17500,
                "_trash_tmp_id": "TMP_1772953179312_KE9BY"
            },
            "type": "student",
            "deletedAt": "2026-03-08T06:59:39.312Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772951248281_DRXUR",
            "item": {
                "id": 1772950794540,
                "date": "2026-03-08",
                "type": "Expense",
                "amount": 14000,
                "method": "Cash",
                "person": "",
                "category": "Salary Biplob",
                "description": ""
            },
            "type": "finance",
            "deletedAt": "2026-03-08T06:27:28.281Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772951248182_GK8CP",
            "item": {
                "id": 1772950794540,
                "date": "2026-03-08",
                "type": "Expense",
                "amount": 14000,
                "method": "Cash",
                "person": "",
                "category": "Salary Biplob",
                "description": ""
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T06:27:28.182Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772951246911_JDD35",
            "item": {
                "id": 1772950794540,
                "date": "2026-03-08",
                "type": "Expense",
                "amount": 14000,
                "method": "Cash",
                "person": "",
                "category": "Salary Biplob",
                "description": ""
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T06:27:26.912Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772951189519_LFV76",
            "item": {
                "id": 1772951051631,
                "date": "2026-03-08",
                "type": "Expense",
                "amount": 10000,
                "method": "Cash",
                "person": "",
                "category": "Salary Tamanna",
                "description": ""
            },
            "type": "finance",
            "deletedAt": "2026-03-08T06:26:29.519Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772951189433_5MXNV",
            "item": {
                "id": 1772951051631,
                "date": "2026-03-08",
                "type": "Expense",
                "amount": 10000,
                "method": "Cash",
                "person": "",
                "category": "Salary Tamanna",
                "description": ""
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T06:26:29.433Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772951187946_TWD98",
            "item": {
                "id": 1772951051631,
                "date": "2026-03-08",
                "type": "Expense",
                "amount": 10000,
                "method": "Cash",
                "person": "",
                "category": "Salary Tamanna",
                "description": ""
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T06:26:27.947Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772951117483_11JF3",
            "item": {
                "id": 1772951081055,
                "date": "2026-03-08",
                "type": "Expense",
                "amount": 20000,
                "method": "Bikash",
                "person": "",
                "category": "Salary Kayum",
                "description": ""
            },
            "type": "finance",
            "deletedAt": "2026-03-08T06:25:17.483Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772951117432_D1JMI",
            "item": {
                "id": 1772951081055,
                "date": "2026-03-08",
                "type": "Expense",
                "amount": 20000,
                "method": "Bikash",
                "person": "",
                "category": "Salary Kayum",
                "description": ""
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T06:25:17.432Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772951116329_TB9RG",
            "item": {
                "id": 1772951081055,
                "date": "2026-03-08",
                "type": "Expense",
                "amount": 20000,
                "method": "Bikash",
                "person": "",
                "category": "Salary Kayum",
                "description": ""
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T06:25:16.329Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772941511468_GDRA4",
            "item": {
                "id": "REC_Masuk_Al_Hossain_0_1771682442139",
                "date": "2026-02-19",
                "type": "Income",
                "amount": 3000,
                "method": "Cash",
                "person": "Masuk Al Hossain",
                "category": "Student Installment",
                "recovered": true,
                "studentId": null,
                "timestamp": "2026-02-21T14:00:42.139Z",
                "description": "Installment payment for student: Masuk Al Hossain | Batch: 18"
            },
            "type": "finance",
            "deletedAt": "2026-03-08T03:45:11.468Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772941511431_GCA34",
            "item": {
                "id": "REC_Masuk_Al_Hossain_0_1771682442139",
                "date": "2026-02-19",
                "type": "Income",
                "amount": 3000,
                "method": "Cash",
                "person": "Masuk Al Hossain",
                "category": "Student Installment",
                "recovered": true,
                "studentId": null,
                "timestamp": "2026-02-21T14:00:42.139Z",
                "description": "Installment payment for student: Masuk Al Hossain | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T03:45:11.432Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772941509231_9DR89",
            "item": {
                "id": "REC_Masuk_Al_Hossain_0_1771682442139",
                "date": "2026-02-19",
                "type": "Income",
                "amount": 3000,
                "method": "Cash",
                "person": "Masuk Al Hossain",
                "category": "Student Installment",
                "recovered": true,
                "studentId": null,
                "timestamp": "2026-02-21T14:00:42.139Z",
                "description": "Installment payment for student: Masuk Al Hossain | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T03:45:09.231Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772941504051_OYVN8",
            "item": {
                "id": "REC_Moh__Zainul_Abedin_0_1771682442139",
                "date": "2026-01-31",
                "type": "Income",
                "amount": 5000,
                "method": "Cash",
                "person": "Moh. Zainul Abedin",
                "category": "Student Installment",
                "recovered": true,
                "studentId": null,
                "timestamp": "2026-02-21T14:00:42.139Z",
                "description": "Installment payment for student: Moh. Zainul Abedin | Batch: 18"
            },
            "type": "finance",
            "deletedAt": "2026-03-08T03:45:04.051Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772941503986_NHZR6",
            "item": {
                "id": "REC_Moh__Zainul_Abedin_0_1771682442139",
                "date": "2026-01-31",
                "type": "Income",
                "amount": 5000,
                "method": "Cash",
                "person": "Moh. Zainul Abedin",
                "category": "Student Installment",
                "recovered": true,
                "studentId": null,
                "timestamp": "2026-02-21T14:00:42.139Z",
                "description": "Installment payment for student: Moh. Zainul Abedin | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T03:45:03.986Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772941501771_DLHCR",
            "item": {
                "id": "REC_Moh__Zainul_Abedin_0_1771682442139",
                "date": "2026-01-31",
                "type": "Income",
                "amount": 5000,
                "method": "Cash",
                "person": "Moh. Zainul Abedin",
                "category": "Student Installment",
                "recovered": true,
                "studentId": null,
                "timestamp": "2026-02-21T14:00:42.139Z",
                "description": "Installment payment for student: Moh. Zainul Abedin | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-08T03:45:01.771Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772939563410_09TI5",
            "item": {
                "due": 12000,
                "name": "Masuk Al Hossain",
                "paid": 3000,
                "batch": "18",
                "phone": "01733580871",
                "photo": null,
                "course": "Air Ticket & Visa processing Both",
                "method": "Cash",
                "remarks": "",
                "studentId": "WF-18009",
                "bloodGroup": "",
                "enrollDate": "0019-02-19",
                "fatherName": "",
                "motherName": "",
                "installments": [
                    {
                        "date": "0019-02-19",
                        "amount": 3000,
                        "method": "Cash"
                    }
                ],
                "reminderDate": null,
                "totalPayment": 15000,
                "_trash_tmp_id": "TMP_1772939563410_AWEZD"
            },
            "type": "student",
            "deletedAt": "2026-03-08T03:12:43.410Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772939549402_EH8RI",
            "item": {
                "due": 8500,
                "name": "Moh. Zainul Abedin",
                "paid": 5000,
                "batch": "18",
                "phone": "01602784581",
                "photo": null,
                "course": "Air Ticket & Visa processing Both",
                "method": "Cash",
                "remarks": "",
                "studentId": "WF-18018",
                "bloodGroup": "",
                "enrollDate": "2026-01-31",
                "fatherName": "",
                "motherName": "",
                "installments": [],
                "reminderDate": "2026-01-31",
                "totalPayment": 13500,
                "_trash_tmp_id": "TMP_1772939549401_OPK7U"
            },
            "type": "student",
            "deletedAt": "2026-03-08T03:12:29.402Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772916708941_JQMNP",
            "item": {
                "due": 61111,
                "name": "shakib",
                "paid": 5555,
                "batch": "5",
                "phone": "01757208244",
                "photo": null,
                "course": "Student Visa",
                "method": "CITY BANK",
                "remarks": "",
                "studentId": "WF-5004",
                "bloodGroup": "A+",
                "enrollDate": "2026-03-07",
                "fatherName": "adcdsf",
                "motherName": "sd",
                "installments": [
                    {
                        "date": "2026-03-07",
                        "amount": 5555,
                        "method": "CITY BANK"
                    }
                ],
                "reminderDate": null,
                "totalPayment": 66666,
                "_trash_tmp_id": "TMP_1772916708941_9AFT3"
            },
            "type": "student",
            "deletedAt": "2026-03-07T20:51:48.941Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772908456022_MQRP7",
            "item": {
                "due": 10000,
                "name": "shakib",
                "paid": 0,
                "batch": "6",
                "phone": "01757208244",
                "photo": null,
                "course": "Caregiver",
                "method": "Cash",
                "remarks": "",
                "studentId": "WF-6003",
                "bloodGroup": "O+",
                "enrollDate": "2026-03-07",
                "fatherName": "adcdsf",
                "motherName": "fsdfs",
                "installments": [],
                "reminderDate": null,
                "totalPayment": 10000,
                "_trash_tmp_id": "TMP_1772908456022_2JLFD"
            },
            "type": "student",
            "deletedAt": "2026-03-07T18:34:16.022Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772908455991_RLOR6",
            "item": {
                "id": "FIN-1772905962905-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 3000,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Fee",
                "studentId": "WF-6003",
                "timestamp": "2026-03-07T17:52:20.880Z",
                "description": "Enrollment fee for student: shakib | ID: WF-6003 | Batch: 6"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T18:34:15.991Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772908454702_K8UFS",
            "item": {
                "id": "FIN-1772905962905-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 3000,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Fee",
                "studentId": "WF-6003",
                "timestamp": "2026-03-07T17:52:20.880Z",
                "description": "Enrollment fee for student: shakib | ID: WF-6003 | Batch: 6"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T18:34:14.702Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772905818355_ANPL7",
            "item": {
                "due": 43889,
                "name": "shakib",
                "paid": 11666,
                "batch": "18",
                "phone": "j",
                "photo": null,
                "course": "Caregiver",
                "method": "Cash",
                "remarks": "",
                "studentId": "WF-18023",
                "bloodGroup": "O+",
                "enrollDate": "2026-03-07",
                "fatherName": "l",
                "motherName": "k",
                "installments": [
                    {
                        "date": "2026-03-07",
                        "amount": 6666,
                        "method": "Cash"
                    }
                ],
                "reminderDate": null,
                "totalPayment": 55555,
                "_trash_tmp_id": "TMP_1772905818355_AWIM5"
            },
            "type": "student",
            "deletedAt": "2026-03-07T17:50:18.355Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772902080092_7LI9V",
            "item": {
                "date": "2026-03-07",
                "amount": 4000,
                "method": "Cash",
                "studentName": "shakib",
                "_trash_tmp_id": "TMP_1772902080092_10FHA"
            },
            "type": "installment",
            "deletedAt": "2026-03-07T16:48:00.092Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772902080087_MODQ4",
            "item": {
                "date": "2026-03-07",
                "batch": "6",
                "amount": 4000,
                "method": "Cash",
                "description": "Installment: ৳4,000 | shakib | 2026-03-07",
                "studentName": "shakib",
                "studentIndex": 22,
                "_trash_tmp_id": "TMP_1772902080086_LSS0I"
            },
            "type": "installment",
            "deletedAt": "2026-03-07T16:48:00.087Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772901137929_JLCIV",
            "item": {
                "date": "2026-03-07",
                "name": "Visitor Tester",
                "phone": "0190000000",
                "course": "Aviation",
                "addedAt": "2026-03-07T16:32:16.085Z",
                "_trash_tmp_id": "TMP_1772901137929_P1VH8"
            },
            "type": "visitor",
            "deletedAt": "2026-03-07T16:32:17.929Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772901135551_X2V12",
            "item": {
                "id": "EMP_SIM_1772901132318",
                "name": "Simulator Instructor",
                "role": "Instructor",
                "phone": "0180000000",
                "salary": 25000,
                "status": "Active",
                "joiningDate": "2026-03-07"
            },
            "type": "Employee",
            "deletedAt": "2026-03-07T16:32:15.551Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772901131753_A4H7N",
            "item": {
                "id": 1772901127474,
                "date": "2026-03-07",
                "type": "Loan Given",
                "amount": 5000,
                "method": "Cash",
                "person": "Loan Tester (1772901127465)",
                "category": "Loan",
                "description": "[Sim] Loan Testing"
            },
            "type": "finance",
            "deletedAt": "2026-03-07T16:32:11.753Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772901126270_ZQKAT",
            "item": {
                "due": 8000,
                "name": "Automated Tester (S)",
                "paid": 2000,
                "batch": "TEST",
                "phone": "017000000",
                "course": "Test Course",
                "method": "Cash",
                "status": "Active",
                "studentId": "SIM_S_1772901125052",
                "enrollDate": "2026-03-07",
                "installments": [
                    {
                        "date": "2026-03-07",
                        "amount": 2000,
                        "method": "Cash"
                    }
                ],
                "totalPayment": 10000,
                "_trash_tmp_id": "TMP_1772901126270_X8BBX"
            },
            "type": "student",
            "deletedAt": "2026-03-07T16:32:06.271Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772898602385_Q2ECG",
            "item": {
                "id": "FIN-1772896280496-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 666,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Fee",
                "timestamp": "2026-03-07T15:10:53.645Z",
                "description": "Enrollment fee for student: shakib | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:50:02.386Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772898601521_U1PI5",
            "item": {
                "id": "FIN-1772896280496-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 666,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Fee",
                "timestamp": "2026-03-07T15:10:53.645Z",
                "description": "Enrollment fee for student: shakib | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:50:01.522Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772898597358_GV42V",
            "item": {
                "id": "FIN-1772897960782-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 5555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Fee",
                "timestamp": "2026-03-07T15:39:19.695Z",
                "description": "Enrollment fee for student: shakib | Batch: 6"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:49:57.358Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772898596443_1NO9L",
            "item": {
                "id": "FIN-1772897960782-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 5555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Fee",
                "timestamp": "2026-03-07T15:39:19.695Z",
                "description": "Enrollment fee for student: shakib | Batch: 6"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:49:56.443Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772898590732_0W6ZZ",
            "item": {
                "due": 66666,
                "name": "Ferdous Ahmed",
                "paid": 0,
                "batch": "6",
                "phone": "01757208244",
                "photo": null,
                "course": "Caregiver",
                "method": "CITY BANK",
                "remarks": "",
                "studentId": "WF-6003",
                "bloodGroup": "B+",
                "enrollDate": "2026-03-07",
                "fatherName": "adcdsf",
                "motherName": "fsdfs",
                "installments": [],
                "reminderDate": null,
                "totalPayment": 66666,
                "_trash_tmp_id": "TMP_1772898590732_DUC01"
            },
            "type": "student",
            "deletedAt": "2026-03-07T15:49:50.732Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772898590660_PQ2JZ",
            "item": {
                "id": "FIN-1772898362283-1",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 55555,
                "method": "CITY BANK",
                "person": "Ferdous Ahmed",
                "category": "Student Fee",
                "timestamp": "2026-03-07T15:45:19.442Z",
                "description": "Enrollment fee for student: Ferdous Ahmed | Batch: 6"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:49:50.660Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772898589680_RHIWP",
            "item": {
                "id": "FIN-1772898362283-1",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 55555,
                "method": "CITY BANK",
                "person": "Ferdous Ahmed",
                "category": "Student Fee",
                "timestamp": "2026-03-07T15:45:19.442Z",
                "description": "Enrollment fee for student: Ferdous Ahmed | Batch: 6"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:49:49.680Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772898583300_CWL45",
            "item": {
                "id": 1772898355763,
                "date": "2026-03-07",
                "type": "Income",
                "amount": 555,
                "method": "Cash",
                "person": "Ferdous Ahmed",
                "category": "Student Installment",
                "timestamp": "2026-03-07T15:45:55.763Z",
                "description": "Installment payment for student: Ferdous Ahmed | Batch: 6"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:49:43.300Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772898582122_5Y5U5",
            "item": {
                "id": 1772898355763,
                "date": "2026-03-07",
                "type": "Income",
                "amount": 555,
                "method": "Cash",
                "person": "Ferdous Ahmed",
                "category": "Student Installment",
                "timestamp": "2026-03-07T15:45:55.763Z",
                "description": "Installment payment for student: Ferdous Ahmed | Batch: 6"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:49:42.122Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772898250366_B44L3",
            "item": {
                "due": 54890,
                "name": "shakib",
                "paid": 11776,
                "batch": "6",
                "phone": "01757208244",
                "photo": null,
                "course": "Student Visa",
                "method": "Cash",
                "remarks": "",
                "studentId": "WF-6002",
                "bloodGroup": "A-",
                "enrollDate": "2026-03-07",
                "fatherName": "lkl",
                "motherName": "kjkjnj",
                "installments": [
                    {
                        "date": "2026-03-07",
                        "amount": 5555,
                        "method": "Cash"
                    }
                ],
                "reminderDate": null,
                "totalPayment": 66666,
                "_trash_tmp_id": "TMP_1772898250366_UTVJT"
            },
            "type": "student",
            "deletedAt": "2026-03-07T15:44:10.366Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772898093057_2TGQL",
            "item": {
                "id": 1772898030260,
                "date": "2026-03-07",
                "type": "Income",
                "amount": 5555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Installment",
                "timestamp": "2026-03-07T15:40:30.260Z",
                "description": "Installment payment for student: shakib | Batch: 6"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:41:33.057Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772898091192_6MSEO",
            "item": {
                "id": 1772898030260,
                "date": "2026-03-07",
                "type": "Income",
                "amount": 5555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Installment",
                "timestamp": "2026-03-07T15:40:30.260Z",
                "description": "Installment payment for student: shakib | Batch: 6"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:41:31.192Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772896208787_L3KNO",
            "item": {
                "id": "FIN-1772895998708-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 5555,
                "method": "Brac Bank",
                "person": "asif apon",
                "category": "Student Fee",
                "timestamp": "2026-03-07T15:06:26.398Z",
                "description": "Enrollment fee for student: asif apon | Batch: 5"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:10:08.787Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772896205775_FHSQZ",
            "item": {
                "id": "FIN-1772895998708-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 5555,
                "method": "Brac Bank",
                "person": "asif apon",
                "category": "Student Fee",
                "timestamp": "2026-03-07T15:06:26.398Z",
                "description": "Enrollment fee for student: asif apon | Batch: 5"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:10:05.775Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772895732271_W66Y4",
            "item": {
                "id": "FIN-1772894916212-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 5555,
                "method": "CITY BANK",
                "person": "shakib",
                "category": "Student Fee",
                "timestamp": "2026-03-07T14:48:30.848Z",
                "description": "Enrollment fee for student: shakib | Batch: 5"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:02:12.271Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772895730771_Q7HUN",
            "item": {
                "id": "FIN-1772894916212-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 5555,
                "method": "CITY BANK",
                "person": "shakib",
                "category": "Student Fee",
                "timestamp": "2026-03-07T14:48:30.848Z",
                "description": "Enrollment fee for student: shakib | Batch: 5"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T15:02:10.771Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772894854691_0AP7J",
            "item": {
                "id": "FIN-1772891433171-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 6666,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Fee",
                "timestamp": "2026-03-07T13:50:32.927Z",
                "description": "Enrollment fee for student: shakib | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T14:47:34.691Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772894853721_81QD0",
            "item": {
                "id": "FIN-1772891433171-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 6666,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Fee",
                "timestamp": "2026-03-07T13:50:32.927Z",
                "description": "Enrollment fee for student: shakib | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T14:47:33.721Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772894846913_SH6BG",
            "item": {
                "id": "FIN-1772894384645-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 5555,
                "method": "CITY BANK",
                "person": "shakib",
                "category": "Student Fee",
                "timestamp": "2026-03-07T14:39:44.069Z",
                "description": "Enrollment fee for student: shakib | Batch: 5"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T14:47:26.913Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772894845831_YG66J",
            "item": {
                "id": "FIN-1772894384645-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 5555,
                "method": "CITY BANK",
                "person": "shakib",
                "category": "Student Fee",
                "timestamp": "2026-03-07T14:39:44.069Z",
                "description": "Enrollment fee for student: shakib | Batch: 5"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T14:47:25.832Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772894223865_MM10E",
            "item": {
                "due": 48334,
                "name": "shakib",
                "paid": 7221,
                "batch": "18",
                "phone": "j",
                "photo": null,
                "course": "Caregiver",
                "method": "Cash",
                "remarks": "",
                "studentId": "WF-18023",
                "bloodGroup": "O+",
                "enrollDate": "2026-03-07",
                "fatherName": "l",
                "motherName": "k",
                "installments": [
                    {
                        "date": "2026-03-07",
                        "amount": 6666,
                        "method": "Cash"
                    },
                    {
                        "date": "2026-03-07",
                        "amount": 555,
                        "method": "Cash"
                    }
                ],
                "reminderDate": null,
                "totalPayment": 55555,
                "_trash_tmp_id": "TMP_1772894223865_CPA9U"
            },
            "type": "student",
            "deletedAt": "2026-03-07T14:37:03.865Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772892997359_OOIPH",
            "item": {
                "id": 1772892862678,
                "date": "2026-03-07",
                "type": "Income",
                "amount": 555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Installment",
                "timestamp": "2026-03-07T14:14:22.678Z",
                "description": "Installment payment for student: shakib | Batch: 18"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T14:16:37.359Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772891530600_LCGFJ",
            "item": {
                "due": 8000,
                "name": "Automated Tester (S)",
                "paid": 2000,
                "batch": "TEST",
                "phone": "017000000",
                "course": "Test Course",
                "method": "Cash",
                "status": "Active",
                "studentId": "SIM_S_1772891529377",
                "enrollDate": "2026-03-07",
                "installments": [
                    {
                        "date": "2026-03-07",
                        "amount": 2000,
                        "method": "Cash"
                    }
                ],
                "totalPayment": 10000,
                "_trash_tmp_id": "TMP_1772891530600_UWTIB"
            },
            "type": "student",
            "deletedAt": "2026-03-07T13:52:10.600Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772891371077_PHXQH",
            "item": {
                "id": "FIN-1772890135388-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 5555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Fee",
                "timestamp": "2026-03-07T13:28:54.272Z",
                "description": "Enrollment fee for student: shakib | Batch: 6"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T13:49:31.077Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772880879758_RTZE2",
            "item": {
                "id": "EMP_SIM_1772880875796",
                "name": "Simulator Instructor",
                "role": "Instructor",
                "phone": "0180000000",
                "salary": 25000,
                "status": "Active",
                "joiningDate": "2026-03-07"
            },
            "type": "Employee",
            "deletedAt": "2026-03-07T10:54:39.758Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772880874934_981KU",
            "item": {
                "id": 1772880869693,
                "date": "2026-03-07",
                "type": "Loan Given",
                "amount": 5000,
                "method": "Cash",
                "person": "Loan Tester (1772880869690)",
                "category": "Loan",
                "description": "[Sim] Loan Testing"
            },
            "type": "finance",
            "deletedAt": "2026-03-07T10:54:34.934Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772880868436_A2OTR",
            "item": {
                "due": 8000,
                "name": "Automated Tester (S)",
                "paid": 2000,
                "batch": "TEST",
                "phone": "017000000",
                "course": "Test Course",
                "method": "Cash",
                "status": "Active",
                "studentId": "SIM_S_1772880867269",
                "enrollDate": "2026-03-07",
                "installments": [
                    {
                        "date": "2026-03-07",
                        "amount": 2000,
                        "method": "Cash"
                    }
                ],
                "totalPayment": 10000,
                "_trash_tmp_id": "TMP_1772880868436_WMWRC"
            },
            "type": "student",
            "deletedAt": "2026-03-07T10:54:28.437Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772865563522_0DYEZ",
            "item": {
                "id": "FIN-1772846786205-0",
                "date": "2026-03-07",
                "type": "Income",
                "amount": 2000,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Fee",
                "timestamp": "2026-03-07T01:25:25.168Z",
                "description": "Enrollment fee for student: shakib | Batch: 6"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T06:39:23.522Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772865558824_CZWVY",
            "item": {
                "id": 1772856354155,
                "date": "2026-03-07",
                "type": "Income",
                "amount": 555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Installment",
                "timestamp": "2026-03-07T04:05:54.155Z",
                "description": "Installment payment for student: shakib | Batch: 6"
            },
            "type": "Finance",
            "deletedAt": "2026-03-07T06:39:18.824Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772860681063_A2YAC",
            "item": {
                "due": 7445,
                "name": "shakib",
                "paid": 2555,
                "batch": "6",
                "phone": "01757208244",
                "photo": null,
                "course": "Student Visa",
                "method": "Cash",
                "remarks": "",
                "studentId": "WF-6001",
                "bloodGroup": "AB+",
                "enrollDate": "2026-03-07",
                "fatherName": "sfsf",
                "motherName": "wef",
                "installments": [
                    {
                        "date": "2026-03-07",
                        "amount": 2000,
                        "method": "Cash"
                    }
                ],
                "reminderDate": null,
                "totalPayment": 10000,
                "_trash_tmp_id": "TMP_1772860681063_B5JWZ"
            },
            "type": "student",
            "deletedAt": "2026-03-07T05:18:01.064Z",
            "deletedBy": "Admin"
        },
        {
            "id": "1772852618989doexx",
            "item": {
                "due": 14445,
                "name": "Reproduction Student",
                "paid": 5555,
                "batch": "Test",
                "phone": "01234567890",
                "photo": null,
                "course": "Caregiver",
                "method": "Cash",
                "remarks": "TESTING BUG",
                "studentId": "WF-001",
                "bloodGroup": "",
                "enrollDate": "2026-03-07",
                "fatherName": "",
                "motherName": "",
                "installments": [
                    {
                        "date": "2026-03-07",
                        "amount": 5555,
                        "method": "Cash"
                    }
                ],
                "reminderDate": null,
                "totalPayment": 20000
            },
            "type": "student",
            "deletedAt": "2026-03-07T03:03:38.989Z",
            "deletedBy": "Admin"
        },
        {
            "id": "17728397902904nu79",
            "item": {
                "id": "FIN-1772832358083-0",
                "date": "2026-03-06",
                "type": "Income",
                "amount": 2000,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Fee",
                "timestamp": "2026-03-06T21:25:31.981Z",
                "description": "Enrollment fee for student: shakib | Batch: 5"
            },
            "type": "finance",
            "deletedAt": "2026-03-06T23:29:50.290Z",
            "deletedBy": "Admin"
        },
        {
            "id": "1772834368341o234p",
            "item": {
                "id": 1772832482317,
                "date": "2026-03-06",
                "type": "Income",
                "amount": 5555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Installment",
                "timestamp": "2026-03-06T21:28:02.317Z",
                "description": "Installment payment for student: shakib | Batch: 5"
            },
            "type": "finance",
            "deletedAt": "2026-03-06T21:59:28.341Z",
            "deletedBy": "Admin"
        },
        {
            "id": "17728342768689vwhl",
            "item": {
                "due": 10000,
                "name": "shakib",
                "paid": 0,
                "batch": "5",
                "phone": "01757208244",
                "photo": null,
                "course": "Air Ticket & Visa processing Both",
                "method": "Cash",
                "remarks": "",
                "studentId": "WF-5001",
                "bloodGroup": "A+",
                "enrollDate": "2026-03-06",
                "fatherName": "kjnknj",
                "motherName": ",m,m",
                "installments": [],
                "reminderDate": null,
                "totalPayment": 10000
            },
            "type": "student",
            "deletedAt": "2026-03-06T21:57:56.868Z",
            "deletedBy": "Admin"
        },
        {
            "id": "17728334464061idzi",
            "item": {
                "id": 1772832482317,
                "date": "2026-03-06",
                "type": "Income",
                "amount": 5555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Installment",
                "timestamp": "2026-03-06T21:28:02.317Z",
                "description": "Installment payment for student: shakib | Batch: 5"
            },
            "type": "finance",
            "deletedAt": "2026-03-06T21:44:06.406Z",
            "deletedBy": "Admin"
        },
        {
            "id": "1772832718369dkejg",
            "item": {
                "id": 1772832482317,
                "date": "2026-03-06",
                "type": "Income",
                "amount": 5555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Installment",
                "timestamp": "2026-03-06T21:28:02.317Z",
                "description": "Installment payment for student: shakib | Batch: 5"
            },
            "type": "finance",
            "deletedAt": "2026-03-06T21:31:58.369Z",
            "deletedBy": "Admin"
        },
        {
            "id": "1772832690128yj7tb",
            "item": {
                "id": 1772832482317,
                "date": "2026-03-06",
                "type": "Income",
                "amount": 5555,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Installment",
                "timestamp": "2026-03-06T21:28:02.317Z",
                "description": "Installment payment for student: shakib | Batch: 5"
            },
            "type": "finance",
            "deletedAt": "2026-03-06T21:31:30.128Z",
            "deletedBy": "Admin"
        },
        {
            "id": "1772815325362vhyix",
            "item": {
                "due": 4434,
                "name": "shakib",
                "paid": 1121,
                "batch": "5",
                "phone": "01757208244",
                "photo": null,
                "course": "Air Ticket & Visa processing Both",
                "method": "Cash",
                "remarks": "",
                "studentId": "WF-5001",
                "bloodGroup": "O-",
                "enrollDate": "2026-03-06",
                "fatherName": "sfsf",
                "motherName": ",m,m",
                "installments": [
                    {
                        "date": "2026-03-06",
                        "amount": 555,
                        "method": "Cash"
                    }
                ],
                "reminderDate": null,
                "totalPayment": 5555
            },
            "type": "student",
            "deletedAt": "2026-03-06T16:42:05.362Z",
            "deletedBy": "Admin"
        },
        {
            "id": "1772814003652h8ljb",
            "item": {
                "id": 1772813768269,
                "date": "2026-03-06",
                "type": "Income",
                "amount": 566,
                "method": "Cash",
                "person": "shakib",
                "category": "Student Installment",
                "timestamp": "2026-03-06T16:16:08.269Z",
                "description": "Installment payment for student: shakib | Batch: 5"
            },
            "type": "finance",
            "deletedAt": "2026-03-06T16:20:03.652Z",
            "deletedBy": "Admin"
        },
        {
            "id": "177281392975819zem",
            "item": {
                "date": "2026-03-06",
                "batch": "5",
                "amount": 555,
                "method": "Cash",
                "description": "Installment: ৳555 | shakib | 2026-03-06",
                "studentName": "shakib",
                "studentIndex": 22
            },
            "type": "installment",
            "deletedAt": "2026-03-06T16:18:49.758Z",
            "deletedBy": "Admin"
        },
        {
            "id": "17728107013066h7q1",
            "item": {
                "id": 1771891641165.149,
                "date": "0019-02-19",
                "type": "Income",
                "amount": 3000,
                "method": "Cash",
                "person": "Masuk Al Hossain",
                "category": "Student Installment",
                "timestamp": "2026-02-24T00:07:21.165Z",
                "description": "Auto-recovered installment for Masuk Al Hossain"
            },
            "type": "finance",
            "deletedAt": "2026-03-06T15:25:01.306Z",
            "deletedBy": "Admin"
        },
        {
            "id": "1772624658241pox7d",
            "item": {
                "id": 1772624613430,
                "date": "2026-03-04",
                "type": "Loan Received",
                "amount": 60000,
                "method": "Cash",
                "person": "HARUN",
                "category": "Loan",
                "description": ""
            },
            "type": "finance",
            "deletedAt": "2026-03-04T11:44:18.241Z",
            "deletedBy": "Admin"
        },
        {
            "id": "1772616657903l47kl",
            "item": {
                "id": 1772036146303,
                "date": "2026-02-25",
                "type": "Loan Given",
                "amount": 555,
                "method": "DUTCH-BANGLA BANK LIMITED",
                "person": "harun",
                "category": "Salary",
                "description": ""
            },
            "type": "finance",
            "deletedAt": "2026-03-04T09:30:57.903Z",
            "deletedBy": "Admin"
        },
        {
            "id": "1772615935797o21uk",
            "item": {
                "id": 1772195177607,
                "date": "2026-02-27",
                "type": "Loan Received",
                "amount": 5555,
                "method": "Cash",
                "person": "HARUN",
                "category": "Loan",
                "description": ""
            },
            "type": "finance",
            "deletedAt": "2026-03-04T09:18:55.797Z",
            "deletedBy": "Admin"
        },
        {
            "id": "TRASH_1772206825806_7202",
            "item": {
                "id": "note_1772206808068",
                "tag": "",
                "date": "2026-02-27",
                "title": "jk",
                "content": "kklmm",
                "createdAt": "2026-02-27T15:40:08.068Z"
            },
            "type": "keeprecord",
            "deletedAt": "2026-02-27T15:40:25.806Z",
            "deletedBy": "Super Admin"
        },
        {
            "id": "1772188246656sxmfc",
            "item": {
                "id": 1772036146303,
                "date": "2026-02-25",
                "type": "Loan Given",
                "amount": 555,
                "method": "DUTCH-BANGLA BANK LIMITED",
                "person": "harun",
                "category": "Salary",
                "description": ""
            },
            "type": "finance",
            "deletedAt": "2026-02-27T10:30:46.656Z",
            "deletedBy": "Super Admin"
        },
        {
            "id": "17720359294279vp81",
            "item": {
                "id": 1771998930850,
                "date": "2026-02-25",
                "type": "Loan Given",
                "amount": 612855,
                "method": "Cash",
                "person": "HARUN",
                "category": "Salary",
                "description": ""
            },
            "type": "finance",
            "deletedAt": "2026-02-25T16:12:09.427Z",
            "deletedBy": "Super Admin"
        },
        {
            "id": "1771999391152x0n4w",
            "item": {
                "text": "j",
                "type": "warning",
                "createdAt": 1771999334775,
                "expiresAt": 1772042534775
            },
            "type": "notice",
            "deletedAt": "2026-02-25T06:03:11.152Z",
            "deletedBy": "Super Admin"
        }
    ],
    "activityHistory": [
        {
            "id": "ACT_1773868722568_M4GMM",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T21:18:42.568Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773867522598_NZSB9",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T20:58:42.598Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773866442627_4KREB",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T20:40:42.627Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773866330900_P2RV1",
            "action": "SETTINGS",
            "type": "settings",
            "description": "General settings updated",
            "user": "Admin",
            "timestamp": "2026-03-18T20:38:50.900Z",
            "data": {}
        },
        {
            "id": "ACT_1773866305699_TTOGI",
            "action": "STUDENT",
            "type": "delete",
            "description": "Student moved to trash: shakib | Batch: 5 | Course: Student Visa",
            "user": "Admin",
            "timestamp": "2026-03-18T20:38:25.699Z",
            "data": {
                "name": "shakib",
                "phone": "6666666666",
                "fatherName": "",
                "motherName": "",
                "bloodGroup": "AB+",
                "course": "Student Visa",
                "batch": "5",
                "enrollDate": "2026-03-18",
                "method": "Bikash",
                "totalPayment": 5555,
                "paid": 555,
                "due": 5000,
                "reminderDate": "2026-03-19",
                "studentId": "WF-5005",
                "remarks": "",
                "photo": null,
                "installments": [
                    {
                        "amount": 555,
                        "date": "2026-03-18",
                        "method": "Bikash"
                    }
                ],
                "_trash_tmp_id": "TMP_1773866305675_DTD2D"
            }
        },
        {
            "id": "ACT_1773866305688_8M4E3",
            "action": "DELETE",
            "type": "student",
            "description": "student deleted: shakib",
            "user": "Admin",
            "timestamp": "2026-03-18T20:38:25.688Z",
            "data": {
                "name": "shakib",
                "phone": "6666666666",
                "fatherName": "",
                "motherName": "",
                "bloodGroup": "AB+",
                "course": "Student Visa",
                "batch": "5",
                "enrollDate": "2026-03-18",
                "method": "Bikash",
                "totalPayment": 5555,
                "paid": 555,
                "due": 5000,
                "reminderDate": "2026-03-19",
                "studentId": "WF-5005",
                "remarks": "",
                "photo": null,
                "installments": [
                    {
                        "amount": 555,
                        "date": "2026-03-18",
                        "method": "Bikash"
                    }
                ],
                "_trash_tmp_id": "TMP_1773866305675_DTD2D"
            }
        },
        {
            "id": "ACT_1773866263663_M1LKD",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T20:37:43.663Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773865718994_ZJB9Y",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T20:28:38.994Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773864519564_KYE5M",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T20:08:39.564Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773863439119_EH3FH",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T19:50:39.119Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773863419683_90Q9D",
            "action": "TEST",
            "type": "fail",
            "description": "🧬 Auto Test v9.0: 151/163 pass, 3 fail, 9 warn",
            "user": "Admin",
            "timestamp": "2026-03-18T19:50:19.683Z",
            "data": {
                "total": 163,
                "fail": 3,
                "warn": 9
            }
        },
        {
            "id": "ACT_1773863418612_HTYMB",
            "action": "TEST",
            "type": "test",
            "description": "Auto Test Suite v8 probe",
            "user": "Admin",
            "timestamp": "2026-03-18T19:50:18.612Z",
            "data": {}
        },
        {
            "id": "ACT_1773863217099_07VBL",
            "action": "LOGIN",
            "type": "login",
            "description": "User logged in: Admin",
            "user": "Admin",
            "timestamp": "2026-03-18T19:46:57.099Z",
            "data": {}
        },
        {
            "id": "ACT_1773862957435_Y3SZL",
            "action": "SETTINGS",
            "type": "settings",
            "description": "General settings updated",
            "user": "Admin",
            "timestamp": "2026-03-18T19:42:37.435Z",
            "data": {}
        },
        {
            "id": "ACT_1773862905544_X4M52",
            "action": "STUDENT",
            "type": "add",
            "description": "Enrolled new student: shakib | Batch: 5 | Paid: ৳555",
            "user": "Admin",
            "timestamp": "2026-03-18T19:41:45.544Z",
            "data": {}
        },
        {
            "id": "ACT_1773862770570_JM0OZ",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T19:39:30.570Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773862149587_X5JC4",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T19:29:09.587Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773861069612_CM41O",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T19:11:09.613Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773859990597_46U5L",
            "action": "REPORT",
            "type": "generate",
            "description": "Generated Profit Report for Batch: 18",
            "user": "Admin",
            "timestamp": "2026-03-18T18:53:10.597Z",
            "data": {}
        },
        {
            "id": "ACT_1773859900601_RGZBC",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T18:51:40.601Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773859413601_JMVRC",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T18:43:33.601Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773859122591_SFMV7",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T18:38:42.591Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773857922584_OL468",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T18:18:42.584Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773856842594_LGBUW",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T18:00:42.594Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773855666591_VSQLP",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T17:41:06.591Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773855544322_Z1QO2",
            "action": "LOGIN",
            "type": "login",
            "description": "User logged in: Admin",
            "user": "Admin",
            "timestamp": "2026-03-18T17:39:04.322Z",
            "data": {}
        },
        {
            "id": "ACT_1773855198621_62LAK",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T17:33:18.621Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773854118626_CJQUP",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T17:15:18.626Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773853991665_EV4JK",
            "action": "LOGIN",
            "type": "login",
            "description": "User logged in: Admin",
            "user": "Admin",
            "timestamp": "2026-03-18T17:13:11.665Z",
            "data": {}
        },
        {
            "id": "ACT_1773853502638_DD1M2",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T17:05:02.638Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773853232598_9ZWIA",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T17:00:32.598Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773852775120_UO3V0",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T16:52:55.120Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773852566560_G9F2J",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Browser offline — sync বন্ধ",
            "user": "Admin",
            "timestamp": "2026-03-18T16:49:26.560Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Browser offline — sync বন্ধ"
                ]
            }
        },
        {
            "id": "ACT_1773852410565_V92RY",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T16:46:50.565Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773851889571_OBKOY",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T16:38:09.571Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773851659690_5JWJK",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T16:34:19.690Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773851492053_XO6PQ",
            "action": "LOGIN",
            "type": "login",
            "description": "User logged in: Admin",
            "user": "Admin",
            "timestamp": "2026-03-18T16:31:32.053Z",
            "data": {}
        },
        {
            "id": "ACT_1773851222576_50V30",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T16:27:02.576Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773851146560_ICC82",
            "action": "LOGIN",
            "type": "login",
            "description": "User logged in: Admin",
            "user": "Admin",
            "timestamp": "2026-03-18T16:25:46.560Z",
            "data": {}
        },
        {
            "id": "ACT_1773833620580_87AZA",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-18T11:33:40.580Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773833542553_KQTOC",
            "action": "LOGIN",
            "type": "login",
            "description": "User logged in: Admin",
            "user": "Admin",
            "timestamp": "2026-03-18T11:32:22.553Z",
            "data": {}
        },
        {
            "id": "ACT_1773755621522_XX9Z1",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ❌ Egress throttled (446 req) — Cloud pull বন্ধ | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-17T13:53:41.522Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "❌ Egress throttled (446 req) — Cloud pull বন্ধ",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773754541560_0X42Y",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ❌ Egress throttled (446 req) — Cloud pull বন্ধ | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-17T13:35:41.560Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "❌ Egress throttled (446 req) — Cloud pull বন্ধ",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773754239158_PM77E",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ❌ Egress throttled (446 req) — Cloud pull বন্ধ | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-17T13:30:39.159Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "❌ Egress throttled (446 req) — Cloud pull বন্ধ",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773753949111_LGZNP",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ❌ Egress throttled (446 req) — Cloud pull বন্ধ | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-17T13:25:49.112Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "❌ Egress throttled (446 req) — Cloud pull বন্ধ",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773753781088_A33G2",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ❌ Egress throttled (446 req) — Cloud pull বন্ধ | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-17T13:23:01.088Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "❌ Egress throttled (446 req) — Cloud pull বন্ধ",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773753474142_DI9K8",
            "action": "SYSTEM",
            "type": "warn",
            "description": "🔍 BG Test Issues: ⚠️ initialSyncComplete = false — Cloud sync হয়নি | ❌ Egress throttled (446 req) — Cloud pull বন্ধ | ⚠️ Sync এখনো complete হয়নি",
            "user": "Admin",
            "timestamp": "2026-03-17T13:17:54.142Z",
            "data": {
                "issues": [
                    "⚠️ initialSyncComplete = false — Cloud sync হয়নি",
                    "❌ Egress throttled (446 req) — Cloud pull বন্ধ",
                    "⚠️ Sync এখনো complete হয়নি"
                ]
            }
        },
        {
            "id": "ACT_1773155228941_IOCWK",
            "action": "LOGIN",
            "type": "login",
            "description": "User logged in: Admin",
            "user": "Admin",
            "timestamp": "2026-03-10T15:07:08.941Z",
            "data": {}
        },
        {
            "id": "ACT_1773155177934_OM5EA",
            "data": {
                "run": 3,
                "time": "৯:০৬:১৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T15:06:17.934Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773155118124_YAPCB",
            "data": {
                "run": 2,
                "time": "৯:০৫:১৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T15:05:18.124Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773155068163_1LNGF",
            "data": {
                "run": 1,
                "time": "৯:০৪:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T15:04:28.163Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773155006990_LTXUY",
            "data": {
                "run": 5,
                "time": "৯:০৩:২৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T15:03:26.990Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773154947006_L8UNJ",
            "data": {
                "run": 4,
                "time": "৯:০২:২৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T15:02:27.006Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773154887598_V8EOG",
            "data": {
                "run": 3,
                "time": "৯:০১:২৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T15:01:27.599Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773154827644_WBYIT",
            "data": {
                "run": 2,
                "time": "৯:০০:২৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T15:00:27.644Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773154777141_1SQYB",
            "data": {
                "run": 1,
                "time": "৮:৫৯:৩৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:59:37.142Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773154078875_RYX6K",
            "data": {
                "run": 20
            },
            "type": "test",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:47:58.875Z",
            "description": "✅ Auto-Heal #20: সব ঠিক আছে"
        },
        {
            "id": "ACT_1773153478907_MFQW8",
            "data": {
                "run": 10
            },
            "type": "test",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:37:58.907Z",
            "description": "✅ Auto-Heal #10: সব ঠিক আছে"
        },
        {
            "id": "ACT_1773152785884_SBP2Z",
            "data": {
                "run": 7,
                "time": "৮:২৬:২৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:26:25.884Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773152634809_EUF0C",
            "data": {
                "run": 5,
                "time": "৮:২৩:৫৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:23:54.809Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773152475265_EK1NP",
            "data": {
                "run": 2,
                "time": "৮:২১:১৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:21:15.265Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773152369305_F7HEB",
            "data": {},
            "type": "login",
            "user": "Admin",
            "action": "LOGIN",
            "timestamp": "2026-03-10T14:19:29.305Z",
            "description": "User logged in: Admin"
        },
        {
            "id": "ACT_1773152338674_49UY2",
            "data": {
                "run": 1,
                "time": "৮:১৮:৫৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:18:58.674Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773152175733_OM0E4",
            "data": {
                "run": 3,
                "time": "৮:১৬:১৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:16:15.733Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773152115800_6JHF2",
            "data": {
                "run": 2,
                "time": "৮:১৫:১৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:15:15.800Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773152096541_7C5HP",
            "action": "HEAL",
            "type": "fix",
            "description": "🔧 Auto-Heal #40: 1টি সমস্যা fix হয়েছে",
            "user": "Admin",
            "timestamp": "2026-03-10T14:14:56.541Z",
            "data": {
                "fixes": 1,
                "run": 40,
                "time": "৮:১৪:৫৬ PM"
            }
        },
        {
            "id": "ACT_1773152080711_SY80E",
            "data": {},
            "type": "login",
            "user": "Admin",
            "action": "LOGIN",
            "timestamp": "2026-03-10T14:14:40.711Z",
            "description": "User logged in: Admin"
        },
        {
            "id": "ACT_1773152065728_FWY8Q",
            "data": {
                "run": 1,
                "time": "৮:১৪:২৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:14:25.728Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773151964179_QS3NC",
            "data": {
                "run": 3,
                "time": "৮:১২:৪৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:12:44.179Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773151630995_O7Q1X",
            "data": {
                "run": 4,
                "time": "৮:০৭:১০ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:07:10.995Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773151589675_YUHIO",
            "data": {
                "run": 3,
                "time": "৮:০৬:২৯ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:06:29.675Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773151267007_IEZOR",
            "data": {
                "run": 11,
                "time": "৮:০১:০৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T14:01:07.007Z",
            "description": "🔧 Auto-Heal #11: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773151181944_WVGIC",
            "data": {
                "run": 10
            },
            "type": "test",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:59:41.944Z",
            "description": "✅ Auto-Heal #10: সব ঠিক আছে"
        },
        {
            "id": "ACT_1773150896587_CW036",
            "action": "HEAL",
            "type": "test",
            "description": "✅ Auto-Heal #30: সব ঠিক আছে",
            "user": "Admin",
            "timestamp": "2026-03-10T13:54:56.587Z",
            "data": {
                "run": 30
            }
        },
        {
            "id": "ACT_1773150708842_EB45X",
            "data": {
                "run": 2,
                "time": "৭:৫১:৪৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:51:48.842Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773150058419_KMJVM",
            "action": "HEAL",
            "type": "fix",
            "description": "🔧 Auto-Heal #23: 1টি সমস্যা fix হয়েছে",
            "user": "Admin",
            "timestamp": "2026-03-10T13:40:58.419Z",
            "data": {
                "fixes": 1,
                "run": 23,
                "time": "৭:৪০:৫৮ PM"
            }
        },
        {
            "id": "ACT_1773150031497_4N0XA",
            "data": {},
            "type": "login",
            "user": "Admin",
            "action": "LOGIN",
            "timestamp": "2026-03-10T13:40:31.497Z",
            "description": "User logged in: Admin"
        },
        {
            "id": "ACT_1773149997653_ND1RW",
            "data": {
                "run": 9,
                "time": "৭:৩৯:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:39:57.653Z",
            "description": "🔧 Auto-Heal #9: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149997310_QFHYV",
            "data": {
                "run": 9,
                "time": "৭:৩৯:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:39:57.310Z",
            "description": "🔧 Auto-Heal #9: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149997140_A4GB1",
            "data": {
                "run": 9,
                "time": "৭:৩৯:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:39:57.140Z",
            "description": "🔧 Auto-Heal #9: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149996878_YRRLY",
            "data": {
                "run": 9,
                "time": "৭:৩৯:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:39:56.878Z",
            "description": "🔧 Auto-Heal #9: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149937716_D9HAL",
            "data": {
                "run": 8,
                "time": "৭:৩৮:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:38:57.716Z",
            "description": "🔧 Auto-Heal #8: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149937487_LT4VW",
            "data": {
                "run": 8,
                "time": "৭:৩৮:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:38:57.487Z",
            "description": "🔧 Auto-Heal #8: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149937164_2OR49",
            "data": {
                "run": 8,
                "time": "৭:৩৮:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:38:57.164Z",
            "description": "🔧 Auto-Heal #8: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149936863_G20F3",
            "data": {
                "run": 8,
                "time": "৭:৩৮:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:38:56.863Z",
            "description": "🔧 Auto-Heal #8: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149848742_YEZLK",
            "data": {
                "run": 7,
                "time": "৭:৩৭:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:37:28.742Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149848442_8D7CY",
            "data": {
                "run": 7,
                "time": "৭:৩৭:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:37:28.443Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149848310_GD0OS",
            "data": {
                "run": 7,
                "time": "৭:৩৭:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:37:28.310Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149848069_DFQTS",
            "data": {
                "run": 7,
                "time": "৭:৩৭:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:37:28.069Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149788856_U3CQT",
            "data": {
                "run": 6,
                "time": "৭:৩৬:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:36:28.856Z",
            "description": "🔧 Auto-Heal #6: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149788660_L0AX7",
            "data": {
                "run": 6,
                "time": "৭:৩৬:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:36:28.660Z",
            "description": "🔧 Auto-Heal #6: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149788389_FFOGI",
            "data": {
                "run": 6,
                "time": "৭:৩৬:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:36:28.389Z",
            "description": "🔧 Auto-Heal #6: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149788127_C1UNF",
            "data": {
                "run": 6,
                "time": "৭:৩৬:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:36:28.127Z",
            "description": "🔧 Auto-Heal #6: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149756515_V0SYV",
            "action": "HEAL",
            "type": "test",
            "description": "✅ Auto-Heal #20: সব ঠিক আছে",
            "user": "Admin",
            "timestamp": "2026-03-10T13:35:56.515Z",
            "data": {
                "run": 20
            }
        },
        {
            "id": "ACT_1773149728765_Y2P46",
            "data": {
                "run": 5,
                "time": "৭:৩৫:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:35:28.765Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149728335_VLG1E",
            "data": {
                "run": 5,
                "time": "৭:৩৫:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:35:28.335Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149728064_UXJ7Q",
            "data": {
                "run": 5,
                "time": "৭:৩৫:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:35:28.064Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149727995_H1DTY",
            "data": {
                "run": 5,
                "time": "৭:৩৫:২৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:35:27.995Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149668720_VPDEZ",
            "data": {
                "run": 4,
                "time": "৭:৩৪:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:34:28.720Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149668351_1MQNZ",
            "data": {
                "run": 4,
                "time": "৭:৩৪:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:34:28.351Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149668097_TJ9I0",
            "data": {
                "run": 4,
                "time": "৭:৩৪:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:34:28.097Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149667806_DF565",
            "data": {
                "run": 4,
                "time": "৭:৩৪:২৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:34:27.806Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149608805_4R6Q1",
            "data": {
                "run": 3,
                "time": "৭:৩৩:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:33:28.805Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149608511_9QTIW",
            "data": {
                "run": 3,
                "time": "৭:৩৩:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:33:28.511Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149608205_EHEWP",
            "data": {
                "run": 3,
                "time": "৭:৩৩:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:33:28.205Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149607929_QNV9G",
            "data": {
                "run": 3,
                "time": "৭:৩৩:২৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:33:27.929Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149588646_PVW46",
            "data": {},
            "type": "login",
            "user": "Admin",
            "action": "LOGIN",
            "timestamp": "2026-03-10T13:33:08.646Z",
            "description": "User logged in: Admin"
        },
        {
            "id": "ACT_1773149548597_12LZN",
            "data": {
                "run": 2,
                "time": "৭:৩২:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:32:28.597Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149548290_M9JE0",
            "data": {
                "run": 2,
                "time": "৭:৩২:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:32:28.290Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149548015_4JQAU",
            "data": {
                "run": 2,
                "time": "৭:৩২:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:32:28.015Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149547749_2358S",
            "data": {
                "run": 2,
                "time": "৭:৩২:২৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:32:27.749Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149498759_OH6VT",
            "data": {
                "run": 1,
                "time": "৭:৩১:৩৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:31:38.759Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149498332_R5O9S",
            "data": {
                "run": 1,
                "time": "৭:৩১:৩৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:31:38.332Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149498063_IPBJS",
            "data": {
                "run": 1,
                "time": "৭:৩১:৩৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:31:38.063Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149497801_8A5K5",
            "data": {
                "run": 1,
                "time": "৭:৩১:৩৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:31:37.801Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149457560_DZ0DJ",
            "data": {
                "run": 19,
                "time": "৭:৩০:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:30:57.560Z",
            "description": "🔧 Auto-Heal #19: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149457339_MBHJ4",
            "data": {
                "run": 19,
                "time": "৭:৩০:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:30:57.339Z",
            "description": "🔧 Auto-Heal #19: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149457011_0MV43",
            "data": {
                "run": 19,
                "time": "৭:৩০:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:30:57.011Z",
            "description": "🔧 Auto-Heal #19: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149397341_RCTO1",
            "data": {
                "run": 18,
                "time": "৭:২৯:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:29:57.341Z",
            "description": "🔧 Auto-Heal #18: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149397056_SCH60",
            "data": {
                "run": 18,
                "time": "৭:২৯:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:29:57.056Z",
            "description": "🔧 Auto-Heal #18: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149396875_XMPH4",
            "data": {
                "run": 18,
                "time": "৭:২৯:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:29:56.875Z",
            "description": "🔧 Auto-Heal #18: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149337420_WVHZN",
            "data": {
                "run": 17,
                "time": "৭:২৮:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:28:57.420Z",
            "description": "🔧 Auto-Heal #17: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149337143_OII1Q",
            "data": {
                "run": 17,
                "time": "৭:২৮:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:28:57.143Z",
            "description": "🔧 Auto-Heal #17: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149336872_A1NSS",
            "data": {
                "run": 17,
                "time": "৭:২৮:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:28:56.872Z",
            "description": "🔧 Auto-Heal #17: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149277361_4ZNER",
            "data": {
                "run": 16,
                "time": "৭:২৭:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:27:57.361Z",
            "description": "🔧 Auto-Heal #16: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149277076_EKQ0S",
            "data": {
                "run": 16,
                "time": "৭:২৭:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:27:57.076Z",
            "description": "🔧 Auto-Heal #16: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149276808_Z02JK",
            "data": {
                "run": 16,
                "time": "৭:২৭:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:27:56.808Z",
            "description": "🔧 Auto-Heal #16: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149217375_1TZZP",
            "data": {
                "run": 15,
                "time": "৭:২৬:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:26:57.375Z",
            "description": "🔧 Auto-Heal #15: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149217102_APGUY",
            "data": {
                "run": 15,
                "time": "৭:২৬:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:26:57.102Z",
            "description": "🔧 Auto-Heal #15: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149216804_UAIIM",
            "data": {
                "run": 15,
                "time": "৭:২৬:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:26:56.805Z",
            "description": "🔧 Auto-Heal #15: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149157515_9ZHV7",
            "data": {
                "run": 14,
                "time": "৭:২৫:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:25:57.515Z",
            "description": "🔧 Auto-Heal #14: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149156998_E5OA2",
            "data": {
                "run": 14,
                "time": "৭:২৫:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:25:56.998Z",
            "description": "🔧 Auto-Heal #14: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149156747_3UKXV",
            "data": {
                "run": 14,
                "time": "৭:২৫:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:25:56.747Z",
            "description": "🔧 Auto-Heal #14: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149097565_S5ZBZ",
            "data": {
                "run": 13,
                "time": "৭:২৪:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:24:57.565Z",
            "description": "🔧 Auto-Heal #13: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149097297_O29R1",
            "data": {
                "run": 13,
                "time": "৭:২৪:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:24:57.297Z",
            "description": "🔧 Auto-Heal #13: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149097082_RZUH3",
            "data": {
                "run": 13,
                "time": "৭:২৪:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:24:57.082Z",
            "description": "🔧 Auto-Heal #13: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149037389_ZBN1K",
            "data": {
                "run": 12,
                "time": "৭:২৩:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:23:57.389Z",
            "description": "🔧 Auto-Heal #12: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149037116_JWZKE",
            "data": {
                "run": 12,
                "time": "৭:২৩:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:23:57.116Z",
            "description": "🔧 Auto-Heal #12: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149036832_S7BEH",
            "data": {
                "run": 12,
                "time": "৭:২৩:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:23:56.832Z",
            "description": "🔧 Auto-Heal #12: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773149036798_RQ4BW",
            "action": "HEAL",
            "type": "fix",
            "description": "🔧 Auto-Heal #14: 1টি সমস্যা fix হয়েছে",
            "user": "Admin",
            "timestamp": "2026-03-10T13:23:56.798Z",
            "data": {
                "fixes": 1,
                "run": 14,
                "time": "৭:২৩:৫৬ PM"
            }
        },
        {
            "id": "ACT_1773149036519_LUFS5",
            "data": {
                "run": 10
            },
            "type": "test",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:23:56.519Z",
            "description": "✅ Auto-Heal #10: সব ঠিক আছে"
        },
        {
            "id": "ACT_1773148977312_AJU70",
            "data": {
                "run": 11,
                "time": "৭:২২:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:22:57.312Z",
            "description": "🔧 Auto-Heal #11: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148977026_2DJ2B",
            "data": {
                "run": 11,
                "time": "৭:২২:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:22:57.026Z",
            "description": "🔧 Auto-Heal #11: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148976755_2X4E8",
            "data": {
                "run": 11,
                "time": "৭:২২:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:22:56.755Z",
            "description": "🔧 Auto-Heal #11: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148917402_O7O62",
            "data": {
                "run": 10,
                "time": "৭:২১:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:21:57.402Z",
            "description": "🔧 Auto-Heal #10: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148917187_MEBYF",
            "data": {
                "run": 10,
                "time": "৭:২১:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:21:57.187Z",
            "description": "🔧 Auto-Heal #10: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148916924_RNPEG",
            "data": {
                "run": 10,
                "time": "৭:২১:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:21:56.924Z",
            "description": "🔧 Auto-Heal #10: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148857377_Q1YBB",
            "data": {
                "run": 9,
                "time": "৭:২০:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:20:57.377Z",
            "description": "🔧 Auto-Heal #9: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148857328_TLD1G",
            "data": {
                "run": 9,
                "time": "৭:২০:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:20:57.328Z",
            "description": "🔧 Auto-Heal #9: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148856853_LH23M",
            "data": {
                "run": 9,
                "time": "৭:২০:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:20:56.853Z",
            "description": "🔧 Auto-Heal #9: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148797242_GGV7Q",
            "data": {
                "run": 8,
                "time": "৭:১৯:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:19:57.242Z",
            "description": "🔧 Auto-Heal #8: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148796981_JBVKN",
            "data": {
                "run": 8,
                "time": "৭:১৯:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:19:56.981Z",
            "description": "🔧 Auto-Heal #8: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148796706_94ATF",
            "data": {
                "run": 8,
                "time": "৭:১৯:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:19:56.706Z",
            "description": "🔧 Auto-Heal #8: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148715253_5LMZV",
            "data": {
                "run": 7,
                "time": "৭:১৮:৩৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:18:35.253Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148715063_SMGB0",
            "data": {
                "run": 7,
                "time": "৭:১৮:৩৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:18:35.063Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148714780_9FVP1",
            "data": {
                "run": 7,
                "time": "৭:১৮:৩৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:18:34.780Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148655268_Y1SEE",
            "data": {
                "run": 6,
                "time": "৭:১৭:৩৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:17:35.268Z",
            "description": "🔧 Auto-Heal #6: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148655004_4X1KN",
            "data": {
                "run": 6,
                "time": "৭:১৭:৩৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:17:35.004Z",
            "description": "🔧 Auto-Heal #6: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148654749_EDBHA",
            "data": {
                "run": 6,
                "time": "৭:১৭:৩৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:17:34.749Z",
            "description": "🔧 Auto-Heal #6: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148595279_UED96",
            "data": {
                "run": 5,
                "time": "৭:১৬:৩৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:16:35.279Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148595028_Q6Z9S",
            "data": {
                "run": 5,
                "time": "৭:১৬:৩৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:16:35.028Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148594815_84LX7",
            "data": {
                "run": 5,
                "time": "৭:১৬:৩৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:16:34.815Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148556579_B4O88",
            "action": "HEAL",
            "type": "test",
            "description": "✅ Auto-Heal #10: সব ঠিক আছে",
            "user": "Admin",
            "timestamp": "2026-03-10T13:15:56.579Z",
            "data": {
                "run": 10
            }
        },
        {
            "id": "ACT_1773148536669_S9TDF",
            "data": {
                "run": 4,
                "time": "৭:১৫:৩৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:15:36.669Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148534967_WS7EK",
            "data": {
                "run": 4,
                "time": "৭:১৫:৩৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:15:34.967Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148534687_7557T",
            "data": {
                "run": 4,
                "time": "৭:১৫:৩৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:15:34.687Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148479494_SFIMH",
            "data": {
                "run": 3,
                "time": "৭:১৪:৩৯ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:14:39.494Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148476243_7XYPZ",
            "data": {
                "run": 3,
                "time": "৭:১৪:৩৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:14:36.243Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148475077_S4J7J",
            "data": {
                "run": 3,
                "time": "৭:১৪:৩৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:14:35.077Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148415695_1W7HE",
            "data": {
                "run": 2,
                "time": "৭:১৩:৩৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:13:35.695Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148414963_902EH",
            "data": {
                "run": 2,
                "time": "৭:১৩:৩৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:13:34.963Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148414688_DEYG1",
            "data": {
                "run": 2,
                "time": "৭:১৩:৩৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:13:34.688Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148365744_9GRLM",
            "data": {
                "run": 1,
                "time": "৭:১২:৪৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:12:45.744Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148364978_BZ7EV",
            "data": {
                "run": 1,
                "time": "৭:১২:৪৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:12:44.978Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148364701_HR7X4",
            "data": {
                "run": 1,
                "time": "৭:১২:৪৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:12:44.701Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148339376_99XBY",
            "data": {
                "run": 1,
                "time": "৭:১২:১৯ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:12:19.377Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148339068_B1T08",
            "data": {
                "run": 1,
                "time": "৭:১২:১৯ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:12:19.068Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148338848_YRN1V",
            "data": {
                "run": 1,
                "time": "৭:১২:১৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:12:18.848Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148282352_6A122",
            "data": {
                "run": 1,
                "time": "৭:১১:২২ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:11:22.352Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148282085_SQQAI",
            "data": {
                "run": 1,
                "time": "৭:১১:২২ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:11:22.085Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148281785_9J7AL",
            "data": {
                "run": 1,
                "time": "৭:১১:২১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:11:21.785Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148256949_P9V3M",
            "data": {
                "run": 19,
                "time": "৭:১০:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:10:56.949Z",
            "description": "🔧 Auto-Heal #19: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148197253_HJQE8",
            "data": {
                "run": 18,
                "time": "৭:০৯:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:09:57.253Z",
            "description": "🔧 Auto-Heal #18: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148196973_6QJWC",
            "data": {
                "run": 18,
                "time": "৭:০৯:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:09:56.973Z",
            "description": "🔧 Auto-Heal #18: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148137076_ZRHV9",
            "data": {
                "run": 17,
                "time": "৭:০৮:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:08:57.076Z",
            "description": "🔧 Auto-Heal #17: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148137027_BJ24Z",
            "data": {
                "run": 17,
                "time": "৭:০৮:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:08:57.027Z",
            "description": "🔧 Auto-Heal #17: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148077046_4YI9B",
            "data": {
                "run": 16,
                "time": "৭:০৭:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:07:57.046Z",
            "description": "🔧 Auto-Heal #16: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148076821_W7PPA",
            "data": {
                "run": 16,
                "time": "৭:০৭:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:07:56.821Z",
            "description": "🔧 Auto-Heal #16: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148017069_K8R0P",
            "data": {
                "run": 15,
                "time": "৭:০৬:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:06:57.069Z",
            "description": "🔧 Auto-Heal #15: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148016993_XKR7C",
            "data": {
                "run": 15,
                "time": "৭:০৬:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:06:56.993Z",
            "description": "🔧 Auto-Heal #15: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773148016511_57L05",
            "data": {
                "run": 10
            },
            "type": "test",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:06:56.511Z",
            "description": "✅ Auto-Heal #10: সব ঠিক আছে"
        },
        {
            "id": "ACT_1773147957027_E1MVW",
            "data": {
                "run": 14,
                "time": "৭:০৫:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:05:57.027Z",
            "description": "🔧 Auto-Heal #14: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147956869_QCVH7",
            "data": {
                "run": 14,
                "time": "৭:০৫:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:05:56.869Z",
            "description": "🔧 Auto-Heal #14: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147897061_32MWG",
            "data": {
                "run": 13,
                "time": "৭:০৪:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:04:57.061Z",
            "description": "🔧 Auto-Heal #13: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147896768_3ZF8C",
            "data": {
                "run": 13,
                "time": "৭:০৪:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:04:56.768Z",
            "description": "🔧 Auto-Heal #13: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147837179_RAEHD",
            "data": {
                "run": 12,
                "time": "৭:০৩:৫৭ PM",
                "fixes": 3
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:03:57.179Z",
            "description": "🔧 Auto-Heal #12: 3টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147836908_F1JEH",
            "data": {
                "run": 12,
                "time": "৭:০৩:৫৬ PM",
                "fixes": 3
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:03:56.908Z",
            "description": "🔧 Auto-Heal #12: 3টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147836636_I2GKR",
            "data": {
                "run": 7,
                "time": "৭:০৩:৫৬ PM",
                "fixes": 2
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:03:56.636Z",
            "description": "🔧 Auto-Heal #7: 2টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147778113_GVMHU",
            "data": {
                "run": 11,
                "time": "৭:০২:৫৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:02:58.113Z",
            "description": "🔧 Auto-Heal #11: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147777245_MQJQD",
            "data": {
                "run": 11,
                "time": "৭:০২:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:02:57.245Z",
            "description": "🔧 Auto-Heal #11: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147775152_R4OOQ",
            "action": "DELETE",
            "type": "keeprecord",
            "description": "keepRecord deleted: Test Note __WFTEST__",
            "user": "Admin",
            "timestamp": "2026-03-10T13:02:55.152Z",
            "data": {
                "id": "NOTE_TEST_1773147775145",
                "title": "Test Note __WFTEST__",
                "body": "Test body",
                "createdAt": "2026-03-10T13:02:55.145Z",
                "tag": "Test"
            }
        },
        {
            "id": "ACT_1773147775135_OG74O",
            "action": "DELETE",
            "type": "testitem",
            "description": "testItem deleted: Modal Test __WFTEST__",
            "user": "Admin",
            "timestamp": "2026-03-10T13:02:55.135Z",
            "data": {
                "id": "__MODAL_TEST__1773147775124",
                "name": "Modal Test __WFTEST__"
            }
        },
        {
            "id": "ACT_1773147775112_9O4TS",
            "action": "DELETE",
            "type": "finance",
            "description": "finance deleted: FIN_TEST_1773147775106",
            "user": "Admin",
            "timestamp": "2026-03-10T13:02:55.112Z",
            "data": {
                "id": "FIN_TEST_1773147775106",
                "type": "Income",
                "category": "Test",
                "amount": 100,
                "date": "2026-03-10",
                "note": "Auto Test __WFTEST__"
            }
        },
        {
            "id": "ACT_1773147775095_WN4U2",
            "action": "DELETE",
            "type": "student",
            "description": "student deleted: Fake Student __WFTEST__",
            "user": "Admin",
            "timestamp": "2026-03-10T13:02:55.095Z",
            "data": {
                "rowIndex": 1773147785084,
                "name": "Fake Student __WFTEST__",
                "studentId": "FS_TEST",
                "course": "Test",
                "paid": 500,
                "totalPayment": 1000,
                "due": 500,
                "status": "Active",
                "_trash_tmp_id": "TMP_1773147775085_2RI1Y"
            }
        },
        {
            "id": "ACT_1773147774800_TI2RV",
            "action": "DELETE",
            "type": "finance",
            "description": "finance deleted: FIN_TEST_1773147774790",
            "user": "Admin",
            "timestamp": "2026-03-10T13:02:54.800Z",
            "data": {
                "id": "FIN_TEST_1773147774790",
                "type": "Income",
                "category": "Test",
                "amount": 100,
                "date": "2026-03-10",
                "note": "Auto Test __WFTEST__"
            }
        },
        {
            "id": "ACT_1773147753269_UAQV8",
            "action": "DELETE",
            "type": "finance",
            "description": "finance deleted: FIN_TEST_1773147753258",
            "user": "Admin",
            "timestamp": "2026-03-10T13:02:33.269Z",
            "data": {
                "id": "FIN_TEST_1773147753258",
                "type": "Income",
                "category": "Test",
                "amount": 100,
                "date": "2026-03-10",
                "note": "Auto Test __WFTEST__"
            }
        },
        {
            "id": "ACT_1773147750605_N95PM",
            "action": "HEAL",
            "type": "fix",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে",
            "user": "Admin",
            "timestamp": "2026-03-10T13:02:30.605Z",
            "data": {
                "fixes": 1,
                "run": 1,
                "time": "৭:০২:৩০ PM"
            }
        },
        {
            "id": "ACT_1773147717953_9MFWJ",
            "data": {
                "run": 10,
                "time": "৭:০১:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:01:57.953Z",
            "description": "🔧 Auto-Heal #10: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147717261_98CJ6",
            "data": {
                "run": 10,
                "time": "৭:০১:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:01:57.261Z",
            "description": "🔧 Auto-Heal #10: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147703881_65H26",
            "data": {
                "run": 25,
                "time": "৭:০১:৪৩ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:01:43.881Z",
            "description": "🔧 Auto-Heal #25: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147657055_870L2",
            "data": {
                "run": 9,
                "time": "৭:০০:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:00:57.055Z",
            "description": "🔧 Auto-Heal #9: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147656896_33JXZ",
            "data": {
                "run": 24,
                "time": "৭:০০:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:00:56.896Z",
            "description": "🔧 Auto-Heal #24: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147656751_36K8G",
            "data": {
                "run": 9,
                "time": "৭:০০:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T13:00:56.751Z",
            "description": "🔧 Auto-Heal #9: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147597159_02V2T",
            "data": {
                "run": 8,
                "time": "৬:৫৯:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:59:57.159Z",
            "description": "🔧 Auto-Heal #8: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147596892_0OG9F",
            "data": {
                "run": 8,
                "time": "৬:৫৯:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:59:56.892Z",
            "description": "🔧 Auto-Heal #8: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147509073_YL7F4",
            "data": {
                "run": 7,
                "time": "৬:৫৮:২৯ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:58:29.073Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147508814_PN148",
            "data": {
                "run": 7,
                "time": "৬:৫৮:২৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:58:28.814Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147476210_VR2HD",
            "data": {
                "run": 6,
                "time": "৬:৫৭:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:57:56.210Z",
            "description": "🔧 Auto-Heal #6: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147476205_QRDG4",
            "data": {
                "run": 6,
                "time": "৬:৫৭:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:57:56.205Z",
            "description": "🔧 Auto-Heal #6: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147450639_9ZKCD",
            "data": {
                "run": 20
            },
            "type": "test",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:57:30.639Z",
            "description": "✅ Auto-Heal #20: সব ঠিক আছে"
        },
        {
            "id": "ACT_1773147416197_7KP4A",
            "data": {
                "run": 5,
                "time": "৬:৫৬:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:56:56.197Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147416191_2Q79Z",
            "data": {
                "run": 5,
                "time": "৬:৫৬:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:56:56.191Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147356225_CINPF",
            "data": {
                "run": 4,
                "time": "৬:৫৫:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:55:56.226Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147356207_2P3KU",
            "data": {
                "run": 4,
                "time": "৬:৫৫:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:55:56.207Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147296213_NNEON",
            "data": {
                "run": 3,
                "time": "৬:৫৪:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:54:56.214Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147296203_VVLSL",
            "data": {
                "run": 3,
                "time": "৬:৫৪:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:54:56.203Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147263874_FD5TW",
            "data": {
                "run": 17,
                "time": "৬:৫৪:২৩ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:54:23.874Z",
            "description": "🔧 Auto-Heal #17: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147209293_G3JT9",
            "data": {
                "run": 2,
                "time": "৬:৫৩:২৯ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:53:29.293Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147209034_B743G",
            "data": {
                "run": 2,
                "time": "৬:৫৩:২৯ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:53:29.034Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147159008_0KTXW",
            "data": {
                "run": 1,
                "time": "৬:৫২:৩৯ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:52:39.008Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147158768_7JOG1",
            "data": {
                "run": 1,
                "time": "৬:৫২:৩৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:52:38.768Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147127770_58ZVN",
            "data": {
                "run": 2,
                "time": "৬:৫২:০৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:52:07.770Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147078234_SBG9P",
            "data": {
                "run": 1,
                "time": "৬:৫১:১৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:51:18.235Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147078048_B381H",
            "data": {
                "run": 1,
                "time": "৬:৫১:১৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:51:18.048Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147064737_TP4N5",
            "data": {
                "run": 2,
                "time": "৬:৫১:০৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:51:04.738Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147014689_VO8WS",
            "data": {
                "run": 1,
                "time": "৬:৫০:১৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:50:14.689Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773147001773_MGOU6",
            "data": {
                "run": 7,
                "time": "৬:৫০:০১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:50:01.773Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146941892_Y3SHK",
            "data": {
                "run": 6,
                "time": "৬:৪৯:০১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:49:01.892Z",
            "description": "🔧 Auto-Heal #6: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146881671_KSWFM",
            "data": {
                "run": 5,
                "time": "৬:৪৮:০১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:48:01.671Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146876829_4T6OD",
            "data": {
                "run": 11,
                "time": "৬:৪৭:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:47:56.829Z",
            "description": "🔧 Auto-Heal #11: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146821741_CNFZ8",
            "data": {
                "run": 4,
                "time": "৬:৪৭:০১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:47:01.741Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146816503_MR39H",
            "data": {
                "run": 10
            },
            "type": "test",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:46:56.503Z",
            "description": "✅ Auto-Heal #10: সব ঠিক আছে"
        },
        {
            "id": "ACT_1773146761851_S2LBP",
            "data": {
                "run": 3,
                "time": "৬:৪৬:০১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:46:01.852Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146701907_WBW6A",
            "data": {
                "run": 2,
                "time": "৬:৪৫:০১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:45:01.907Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146651785_39OUJ",
            "data": {
                "run": 1,
                "time": "৬:৪৪:১১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:44:11.785Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146456735_77AMO",
            "data": {
                "run": 15,
                "time": "৬:৪০:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:40:56.735Z",
            "description": "🔧 Auto-Heal #15: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146445013_PRHTB",
            "data": {
                "run": 15,
                "time": "৬:৪০:৪৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:40:45.013Z",
            "description": "🔧 Auto-Heal #15: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146443677_1OWS4",
            "data": {
                "run": 4,
                "time": "৬:৪০:৪৩ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:40:43.677Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146396572_TRIHO",
            "data": {
                "run": 14,
                "time": "৬:৩৯:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:39:56.572Z",
            "description": "🔧 Auto-Heal #14: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146383788_KL60K",
            "data": {
                "run": 3,
                "time": "৬:৩৯:৪৩ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:39:43.788Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146337626_XQYPW",
            "data": {
                "run": 13,
                "time": "৬:৩৮:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:38:57.626Z",
            "description": "🔧 Auto-Heal #13: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146324180_L6TQW",
            "data": {
                "run": 2,
                "time": "৬:৩৮:৪৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:38:44.180Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146276716_BH6MG",
            "data": {
                "run": 12,
                "time": "৬:৩৭:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:37:56.717Z",
            "description": "🔧 Auto-Heal #12: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146272908_9MQB0",
            "data": {
                "run": 1,
                "time": "৬:৩৭:৫২ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:37:52.908Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146264451_506HO",
            "data": {
                "run": 12,
                "time": "৬:৩৭:৪৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:37:44.451Z",
            "description": "🔧 Auto-Heal #12: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146227093_B4D9J",
            "data": {},
            "type": "login",
            "user": "Admin",
            "action": "LOGIN",
            "timestamp": "2026-03-10T12:37:07.093Z",
            "description": "User logged in: Admin"
        },
        {
            "id": "ACT_1773146217658_BJJZM",
            "data": {
                "run": 11,
                "time": "৬:৩৬:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:36:57.658Z",
            "description": "🔧 Auto-Heal #11: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146217379_993Y7",
            "data": {
                "run": 11,
                "time": "৬:৩৬:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:36:57.379Z",
            "description": "🔧 Auto-Heal #11: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146157594_SZ0MR",
            "data": {
                "run": 10,
                "time": "৬:৩৫:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:35:57.595Z",
            "description": "🔧 Auto-Heal #10: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146157423_NQA71",
            "data": {
                "run": 10,
                "time": "৬:৩৫:৫৭ PM",
                "fixes": 2
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:35:57.423Z",
            "description": "🔧 Auto-Heal #10: 2টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146096949_72KI7",
            "data": {
                "run": 9,
                "time": "৬:৩৪:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:34:56.950Z",
            "description": "🔧 Auto-Heal #9: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146096815_G8K3Y",
            "data": {
                "run": 9,
                "time": "৬:৩৪:৫৬ PM",
                "fixes": 2
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:34:56.815Z",
            "description": "🔧 Auto-Heal #9: 2টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146038025_LTMYJ",
            "data": {
                "run": 8,
                "time": "৬:৩৩:৫৮ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:33:58.025Z",
            "description": "🔧 Auto-Heal #8: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773146037589_UZRG3",
            "data": {
                "run": 8,
                "time": "৬:৩৩:৫৭ PM",
                "fixes": 2
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:33:57.589Z",
            "description": "🔧 Auto-Heal #8: 2টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145977615_HTGIT",
            "data": {
                "run": 7,
                "time": "৬:৩২:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:32:57.615Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145977483_ZZDS5",
            "data": {
                "run": 7,
                "time": "৬:৩২:৫৭ PM",
                "fixes": 2
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:32:57.483Z",
            "description": "🔧 Auto-Heal #7: 2টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145917049_9B7C5",
            "data": {
                "run": 10,
                "time": "৬:৩১:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:31:57.049Z",
            "description": "🔧 Auto-Heal #10: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145905621_2MFPU",
            "data": {
                "run": 6,
                "time": "৬:৩১:৪৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:31:45.621Z",
            "description": "🔧 Auto-Heal #6: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145904978_BNESS",
            "data": {
                "run": 6,
                "time": "৬:৩১:৪৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:31:44.978Z",
            "description": "🔧 Auto-Heal #6: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145856202_2VRMC",
            "data": {
                "run": 5,
                "time": "৬:৩০:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:30:56.202Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145855817_N0FDA",
            "data": {
                "run": 5,
                "time": "৬:৩০:৫৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:30:55.817Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145796196_BOWLP",
            "data": {
                "run": 4,
                "time": "৬:২৯:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:29:56.197Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145793899_4MDSH",
            "data": {
                "run": 4,
                "time": "৬:২৯:৫৩ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:29:53.899Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145736207_S06NU",
            "data": {
                "run": 3,
                "time": "৬:২৮:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:28:56.207Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145732522_1J55M",
            "data": {
                "run": 3,
                "time": "৬:২৮:৫২ PM",
                "fixes": 2
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:28:52.522Z",
            "description": "🔧 Auto-Heal #3: 2টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145731893_AQF47",
            "data": {
                "run": 7,
                "time": "৬:২৮:৫১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:28:51.893Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145676193_TA71X",
            "data": {
                "run": 2,
                "time": "৬:২৭:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:27:56.193Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145675371_DB7SE",
            "data": {
                "run": 2,
                "time": "৬:২৭:৫৫ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:27:55.371Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145616204_S6NKS",
            "data": {
                "run": 1,
                "time": "৬:২৬:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:26:56.204Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145616203_9NGYI",
            "data": {
                "run": 1,
                "time": "৬:২৬:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:26:56.203Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145501464_H9UD7",
            "data": {
                "run": 3,
                "time": "৬:২৫:০১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:25:01.464Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145441273_3B6VQ",
            "data": {
                "run": 2,
                "time": "৬:২৪:০১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:24:01.273Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145441064_YRPA5",
            "data": {
                "run": 2,
                "time": "৬:২৪:০১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:24:01.064Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145391051_9SZTG",
            "data": {
                "run": 1,
                "time": "৬:২৩:১১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:23:11.051Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145390788_Z4MQH",
            "data": {
                "run": 1,
                "time": "৬:২৩:১০ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:23:10.788Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145377066_B1K6Y",
            "data": {
                "run": 19,
                "time": "৬:২২:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:22:57.066Z",
            "description": "🔧 Auto-Heal #19: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145316838_4JZHJ",
            "data": {
                "run": 18,
                "time": "৬:২১:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:21:56.838Z",
            "description": "🔧 Auto-Heal #18: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145311375_K8QLY",
            "data": {
                "run": 12,
                "time": "৬:২১:৫১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:21:51.375Z",
            "description": "🔧 Auto-Heal #12: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145256920_ED6JR",
            "data": {
                "run": 17,
                "time": "৬:২০:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:20:56.920Z",
            "description": "🔧 Auto-Heal #17: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145236740_VVCA4",
            "data": {
                "run": 11,
                "time": "৬:২০:৩৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:20:36.740Z",
            "description": "🔧 Auto-Heal #11: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145214798_FMYM9",
            "data": {
                "run": 10,
                "time": "৬:২০:১৪ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:20:14.798Z",
            "description": "🔧 Auto-Heal #10: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145196728_D3FS5",
            "data": {
                "run": 16,
                "time": "৬:১৯:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:19:56.728Z",
            "description": "🔧 Auto-Heal #16: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145136796_TSJ0D",
            "data": {
                "run": 15,
                "time": "৬:১৮:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:18:56.796Z",
            "description": "🔧 Auto-Heal #15: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145076839_JGCBK",
            "data": {
                "run": 14,
                "time": "৬:১৭:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:17:56.839Z",
            "description": "🔧 Auto-Heal #14: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773145016758_ZCEQK",
            "data": {
                "run": 13,
                "time": "৬:১৬:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:16:56.758Z",
            "description": "🔧 Auto-Heal #13: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144957313_76DYV",
            "data": {
                "run": 12,
                "time": "৬:১৫:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:15:57.313Z",
            "description": "🔧 Auto-Heal #12: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144942246_8LJJK",
            "data": {
                "run": 10
            },
            "type": "test",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:15:42.246Z",
            "description": "✅ Auto-Heal #10: সব ঠিক আছে"
        },
        {
            "id": "ACT_1773144896769_S9POY",
            "data": {
                "run": 11,
                "time": "৬:১৪:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:14:56.769Z",
            "description": "🔧 Auto-Heal #11: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144836969_9FW9N",
            "data": {
                "run": 10,
                "time": "৬:১৩:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:13:56.969Z",
            "description": "🔧 Auto-Heal #10: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144776890_JKP9A",
            "data": {
                "run": 9,
                "time": "৬:১২:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:12:56.890Z",
            "description": "🔧 Auto-Heal #9: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144722826_JI0W1",
            "data": {
                "run": 8,
                "time": "৬:১২:০২ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:12:02.826Z",
            "description": "🔧 Auto-Heal #8: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144716756_UP4JM",
            "data": {
                "run": 8,
                "time": "৬:১১:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:11:56.756Z",
            "description": "🔧 Auto-Heal #8: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144609691_XB6LZ",
            "data": {
                "run": 7,
                "time": "৬:১০:০৯ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:10:09.691Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144549752_6EIJV",
            "data": {
                "run": 6,
                "time": "৬:০৯:০৯ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:09:09.752Z",
            "description": "🔧 Auto-Heal #6: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144512210_I7HWI",
            "data": {
                "run": 7,
                "time": "৬:০৮:৩২ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:08:32.210Z",
            "description": "🔧 Auto-Heal #7: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144489712_RZ5KP",
            "data": {
                "run": 5,
                "time": "৬:০৮:০৯ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:08:09.712Z",
            "description": "🔧 Auto-Heal #5: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144431777_JLPAA",
            "data": {
                "run": 4,
                "time": "৬:০৭:১১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:07:11.777Z",
            "description": "🔧 Auto-Heal #4: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144369829_R519J",
            "data": {
                "run": 3,
                "time": "৬:০৬:০৯ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:06:09.829Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144327272_52T0X",
            "data": {},
            "type": "login",
            "user": "Admin",
            "action": "LOGIN",
            "timestamp": "2026-03-10T12:05:27.272Z",
            "description": "User logged in: Admin"
        },
        {
            "id": "ACT_1773144309708_WVJAE",
            "data": {
                "run": 2,
                "time": "৬:০৫:০৯ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:05:09.708Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144260046_SW1JN",
            "data": {
                "run": 1,
                "time": "৬:০৪:২০ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:04:20.046Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144222786_J6KQ0",
            "data": {
                "run": 1,
                "time": "৬:০৩:৪২ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:03:42.786Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144182739_4LNLT",
            "data": {
                "run": 1,
                "time": "৬:০৩:০২ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:03:02.739Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144166760_GU6AP",
            "data": {
                "run": 3,
                "time": "৬:০২:৪৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:02:46.760Z",
            "description": "🔧 Auto-Heal #3: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144106745_O2DBB",
            "data": {
                "run": 2,
                "time": "৬:০১:৪৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:01:46.745Z",
            "description": "🔧 Auto-Heal #2: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773144057194_YZMM5",
            "data": {
                "run": 1,
                "time": "৬:০০:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T12:00:57.194Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773143807025_I88DQ",
            "data": {
                "run": 1,
                "time": "৫:৫৬:৪৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:56:47.025Z",
            "description": "🔧 Auto-Heal #1: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773143764374_5GF2X",
            "data": {
                "run": 3,
                "time": "৫:৫৬:০৪ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:56:04.374Z",
            "description": "🔧 Auto-Heal #3: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773143734635_PCYZ9",
            "data": {
                "run": 4,
                "time": "৫:৫৫:৩৪ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:55:34.635Z",
            "description": "🔧 Auto-Heal #4: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773143694580_DKNLV",
            "data": {
                "run": 2,
                "time": "৫:৫৪:৫৪ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:54:54.580Z",
            "description": "🔧 Auto-Heal #2: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773143674818_A9IAF",
            "data": {
                "run": 3,
                "time": "৫:৫৪:৩৪ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:54:34.819Z",
            "description": "🔧 Auto-Heal #3: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773143644007_EQUHM",
            "data": {
                "run": 1,
                "time": "৫:৫৪:০৪ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:54:04.007Z",
            "description": "🔧 Auto-Heal #1: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773143635413_9IH85",
            "data": {},
            "type": "login",
            "user": "Admin",
            "action": "LOGIN",
            "timestamp": "2026-03-10T11:53:55.413Z",
            "description": "User logged in: Admin"
        },
        {
            "id": "ACT_1773143564760_Y9BE1",
            "data": {
                "run": 1,
                "time": "৫:৫২:৪৪ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:52:44.760Z",
            "description": "🔧 Auto-Heal #1: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773143559494_852GZ",
            "data": {},
            "type": "login",
            "user": "Admin",
            "action": "LOGIN",
            "timestamp": "2026-03-10T11:52:39.494Z",
            "description": "User logged in: Admin"
        },
        {
            "id": "ACT_1773142676832_YUII3",
            "data": {
                "run": 440,
                "time": "৫:৩৭:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:37:56.832Z",
            "description": "🔧 Auto-Heal #440: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142599127_2ZGKE",
            "data": {},
            "type": "login",
            "user": "Admin",
            "action": "LOGIN",
            "timestamp": "2026-03-10T11:36:39.127Z",
            "description": "User logged in: Admin"
        },
        {
            "id": "ACT_1773142556880_97J8O",
            "data": {
                "run": 438,
                "time": "৫:৩৫:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:35:56.880Z",
            "description": "🔧 Auto-Heal #438: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142496853_UEFKS",
            "data": {
                "run": 437,
                "time": "৫:৩৪:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:34:56.853Z",
            "description": "🔧 Auto-Heal #437: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142480985_MVD6H",
            "data": {
                "run": 19,
                "time": "৫:৩৪:৪০ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:34:40.985Z",
            "description": "🔧 Auto-Heal #19: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142476584_LTGJY",
            "data": {
                "run": 1,
                "time": "৫:৩৪:৩৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:34:36.584Z",
            "description": "🔧 Auto-Heal #1: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142445978_M16JW",
            "data": {
                "run": 3,
                "time": "৫:৩৪:০৫ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:34:05.978Z",
            "description": "🔧 Auto-Heal #3: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142437153_HKECH",
            "data": {
                "run": 436,
                "time": "৫:৩৩:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:33:57.153Z",
            "description": "🔧 Auto-Heal #436: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142419801_57LEO",
            "data": {
                "run": 18,
                "time": "৫:৩৩:৩৯ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:33:39.801Z",
            "description": "🔧 Auto-Heal #18: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142385793_TOC32",
            "data": {
                "run": 2,
                "time": "৫:৩৩:০৫ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:33:05.793Z",
            "description": "🔧 Auto-Heal #2: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142377236_7H8LD",
            "data": {
                "run": 435,
                "time": "৫:৩২:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:32:57.236Z",
            "description": "🔧 Auto-Heal #435: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142359985_MUCDC",
            "data": {
                "run": 17,
                "time": "৫:৩২:৩৯ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:32:39.985Z",
            "description": "🔧 Auto-Heal #17: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142335699_FWR25",
            "data": {
                "run": 1,
                "time": "৫:৩২:১৫ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:32:15.699Z",
            "description": "🔧 Auto-Heal #1: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142316963_BH12T",
            "data": {
                "run": 434,
                "time": "৫:৩১:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:31:56.963Z",
            "description": "🔧 Auto-Heal #434: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142302780_TGBRJ",
            "data": {
                "run": 1,
                "time": "৫:৩১:৪২ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:31:42.780Z",
            "description": "🔧 Auto-Heal #1: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142299556_5XE6Y",
            "data": {
                "run": 16,
                "time": "৫:৩১:৩৯ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:31:39.556Z",
            "description": "🔧 Auto-Heal #16: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142257002_A7E73",
            "data": {
                "run": 433,
                "time": "৫:৩০:৫৭ PM",
                "fixes": 14
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:30:57.002Z",
            "description": "🔧 Auto-Heal #433: 14টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142256565_H9KRW",
            "data": {
                "run": 15,
                "time": "৫:৩০:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:30:56.566Z",
            "description": "🔧 Auto-Heal #15: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142247856_WF43F",
            "data": {
                "run": 1,
                "time": "৫:৩০:৪৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:30:47.856Z",
            "description": "🔧 Auto-Heal #1: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142226030_NMN1A",
            "data": {
                "run": 2,
                "time": "৫:৩০:২৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:30:26.030Z",
            "description": "🔧 Auto-Heal #2: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142196899_RQQKT",
            "data": {
                "run": 432,
                "time": "৫:২৯:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:29:56.899Z",
            "description": "🔧 Auto-Heal #432: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142196543_HCY04",
            "data": {
                "run": 14,
                "time": "৫:২৯:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:29:56.543Z",
            "description": "🔧 Auto-Heal #14: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142176004_7CGW3",
            "data": {
                "run": 1,
                "time": "৫:২৯:৩৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:29:36.004Z",
            "description": "🔧 Auto-Heal #1: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142137000_XOHL7",
            "data": {
                "run": 431,
                "time": "৫:২৮:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:28:57.000Z",
            "description": "🔧 Auto-Heal #431: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142134423_J9XT2",
            "data": {
                "run": 2,
                "time": "৫:২৮:৫৪ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:28:54.423Z",
            "description": "🔧 Auto-Heal #2: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142084243_6U2PQ",
            "data": {
                "run": 1,
                "time": "৫:২৮:০৪ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:28:04.243Z",
            "description": "🔧 Auto-Heal #1: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142077114_Q7QFS",
            "data": {
                "run": 430,
                "time": "৫:২৭:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:27:57.114Z",
            "description": "🔧 Auto-Heal #430: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142076500_K7MHR",
            "data": {
                "run": 13,
                "time": "৫:২৭:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:27:56.500Z",
            "description": "🔧 Auto-Heal #13: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142039816_SWHL0",
            "data": {
                "run": 2,
                "time": "৫:২৭:১৯ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:27:19.816Z",
            "description": "🔧 Auto-Heal #2: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142017026_X8WPK",
            "data": {
                "run": 429,
                "time": "৫:২৬:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:26:57.026Z",
            "description": "🔧 Auto-Heal #429: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773142016614_NGMNC",
            "data": {
                "run": 12,
                "time": "৫:২৬:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:26:56.614Z",
            "description": "🔧 Auto-Heal #12: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141989760_GGHUB",
            "data": {
                "run": 1,
                "time": "৫:২৬:২৯ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:26:29.760Z",
            "description": "🔧 Auto-Heal #1: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141956797_VZC9B",
            "data": {
                "run": 428,
                "time": "৫:২৫:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:25:56.797Z",
            "description": "🔧 Auto-Heal #428: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141939511_FLQ23",
            "data": {
                "run": 11,
                "time": "৫:২৫:৩৯ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:25:39.511Z",
            "description": "🔧 Auto-Heal #11: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141936764_ANVCC",
            "data": {
                "run": 1,
                "time": "৫:২৫:৩৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:25:36.765Z",
            "description": "🔧 Auto-Heal #1: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141911530_VY52S",
            "data": {
                "run": 2,
                "time": "৫:২৫:১১ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:25:11.530Z",
            "description": "🔧 Auto-Heal #2: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141896562_SOGHJ",
            "data": {
                "run": 10
            },
            "type": "test",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:24:56.562Z",
            "description": "✅ Auto-Heal #10: সব ঠিক আছে"
        },
        {
            "id": "ACT_1773141836940_3GQDY",
            "data": {
                "run": 426,
                "time": "৫:২৩:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:23:56.940Z",
            "description": "🔧 Auto-Heal #426: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141836648_UI540",
            "data": {
                "run": 9,
                "time": "৫:২৩:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:23:56.648Z",
            "description": "🔧 Auto-Heal #9: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141777480_9YX35",
            "data": {
                "run": 425,
                "time": "৫:২২:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:22:57.480Z",
            "description": "🔧 Auto-Heal #425: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141776764_F4H67",
            "data": {
                "run": 8,
                "time": "৫:২২:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:22:56.764Z",
            "description": "🔧 Auto-Heal #8: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141717080_O6FZQ",
            "data": {
                "run": 424,
                "time": "৫:২১:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:21:57.080Z",
            "description": "🔧 Auto-Heal #424: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141716990_DQCG8",
            "data": {
                "id": "NOTE_TEST_1773141716976",
                "tag": "Test",
                "body": "Test body",
                "title": "Test Note __WFTEST__",
                "createdAt": "2026-03-10T11:21:56.976Z"
            },
            "type": "keeprecord",
            "user": "Admin",
            "action": "DELETE",
            "timestamp": "2026-03-10T11:21:56.990Z",
            "description": "keepRecord deleted: Test Note __WFTEST__"
        },
        {
            "id": "ACT_1773141716960_M26Q4",
            "data": {
                "id": "__MODAL_TEST__1773141716948",
                "name": "Modal Test __WFTEST__"
            },
            "type": "testitem",
            "user": "Admin",
            "action": "DELETE",
            "timestamp": "2026-03-10T11:21:56.960Z",
            "description": "testItem deleted: Modal Test __WFTEST__"
        },
        {
            "id": "ACT_1773141716932_12C4Q",
            "data": {
                "id": "FIN_TEST_1773141716918",
                "date": "2026-03-10",
                "note": "Auto Test __WFTEST__",
                "type": "Income",
                "amount": 100,
                "category": "Test"
            },
            "type": "finance",
            "user": "Admin",
            "action": "DELETE",
            "timestamp": "2026-03-10T11:21:56.932Z",
            "description": "finance deleted: FIN_TEST_1773141716918"
        },
        {
            "id": "ACT_1773141716909_5SQPR",
            "data": {
                "due": 500,
                "name": "Fake Student __WFTEST__",
                "paid": 500,
                "course": "Test",
                "status": "Active",
                "rowIndex": 1773141726898,
                "studentId": "FS_TEST",
                "totalPayment": 1000,
                "_trash_tmp_id": "TMP_1773141716899_XV8OR"
            },
            "type": "student",
            "user": "Admin",
            "action": "DELETE",
            "timestamp": "2026-03-10T11:21:56.910Z",
            "description": "student deleted: Fake Student __WFTEST__"
        },
        {
            "id": "ACT_1773141657457_MGF1A",
            "data": {
                "run": 423,
                "time": "৫:২০:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:20:57.457Z",
            "description": "🔧 Auto-Heal #423: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141648468_RX7ZY",
            "data": {
                "run": 7,
                "time": "৫:২০:৪৮ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:20:48.468Z",
            "description": "🔧 Auto-Heal #7: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141643634_01Q1N",
            "data": {
                "run": 1,
                "time": "৫:২০:৪৩ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:20:43.634Z",
            "description": "🔧 Auto-Heal #1: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141612955_5K3JB",
            "data": {
                "run": 28,
                "time": "৫:২০:১২ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:20:12.955Z",
            "description": "🔧 Auto-Heal #28: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141596868_MGQIK",
            "data": {
                "run": 422,
                "time": "৫:১৯:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:19:56.868Z",
            "description": "🔧 Auto-Heal #422: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141581506_1VEMD",
            "data": {
                "run": 6,
                "time": "৫:১৯:৪১ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:19:41.506Z",
            "description": "🔧 Auto-Heal #6: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141553135_FN17C",
            "data": {
                "run": 27,
                "time": "৫:১৯:১৩ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:19:13.135Z",
            "description": "🔧 Auto-Heal #27: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141537646_QKIC3",
            "data": {
                "run": 421,
                "time": "৫:১৮:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:18:57.646Z",
            "description": "🔧 Auto-Heal #421: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141519617_LGWAC",
            "data": {
                "run": 5,
                "time": "৫:১৮:৩৯ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:18:39.617Z",
            "description": "🔧 Auto-Heal #5: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141493203_0JML4",
            "data": {
                "run": 26,
                "time": "৫:১৮:১৩ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:18:13.204Z",
            "description": "🔧 Auto-Heal #26: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141476973_4DZUG",
            "data": {
                "run": 420,
                "time": "৫:১৭:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:17:56.973Z",
            "description": "🔧 Auto-Heal #420: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141459500_99PJI",
            "data": {
                "run": 4,
                "time": "৫:১৭:৩৯ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:17:39.500Z",
            "description": "🔧 Auto-Heal #4: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141432948_XGAF3",
            "data": {
                "run": 25,
                "time": "৫:১৭:১২ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:17:12.948Z",
            "description": "🔧 Auto-Heal #25: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141417311_W997C",
            "data": {
                "run": 419,
                "time": "৫:১৬:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:16:57.311Z",
            "description": "🔧 Auto-Heal #419: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141399508_RR9SC",
            "data": {
                "run": 3,
                "time": "৫:১৬:৩৯ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:16:39.508Z",
            "description": "🔧 Auto-Heal #3: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141372712_FTKSC",
            "data": {
                "run": 24,
                "time": "৫:১৬:১২ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:16:12.712Z",
            "description": "🔧 Auto-Heal #24: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141357071_BVN4A",
            "data": {
                "run": 418,
                "time": "৫:১৫:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:15:57.071Z",
            "description": "🔧 Auto-Heal #418: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141339518_D10OS",
            "data": {
                "run": 2,
                "time": "৫:১৫:৩৯ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:15:39.518Z",
            "description": "🔧 Auto-Heal #2: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141321538_WF8PQ",
            "data": {
                "run": 23,
                "time": "৫:১৫:২১ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:15:21.538Z",
            "description": "🔧 Auto-Heal #23: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141296947_87RHR",
            "data": {
                "run": 417,
                "time": "৫:১৪:৫৬ PM",
                "fixes": 14
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:14:56.947Z",
            "description": "🔧 Auto-Heal #417: 14টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141296841_9HC1Q",
            "data": {
                "run": 22,
                "time": "৫:১৪:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:14:56.842Z",
            "description": "🔧 Auto-Heal #22: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141289750_COV6H",
            "data": {
                "run": 1,
                "time": "৫:১৪:৪৯ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:14:49.750Z",
            "description": "🔧 Auto-Heal #1: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141237007_QV8CZ",
            "data": {
                "run": 416,
                "time": "৫:১৩:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:13:57.007Z",
            "description": "🔧 Auto-Heal #416: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141221120_QJA0S",
            "data": {
                "run": 104,
                "time": "৫:১৩:৪১ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:13:41.120Z",
            "description": "🔧 Auto-Heal #104: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141192482_UHY2N",
            "data": {
                "run": 21,
                "time": "৫:১৩:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:13:12.482Z",
            "description": "🔧 Auto-Heal #21: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141176989_057JJ",
            "data": {
                "run": 415,
                "time": "৫:১২:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:12:56.989Z",
            "description": "🔧 Auto-Heal #415: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141176572_1MEOP",
            "data": {
                "run": 103,
                "time": "৫:১২:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:12:56.572Z",
            "description": "🔧 Auto-Heal #103: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141132007_UELD5",
            "data": {
                "run": 20,
                "time": "৫:১২:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:12:12.007Z",
            "description": "🔧 Auto-Heal #20: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141117045_V7B91",
            "data": {
                "run": 414,
                "time": "৫:১১:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:11:57.045Z",
            "description": "🔧 Auto-Heal #414: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141116540_QCZ7B",
            "data": {
                "run": 102,
                "time": "৫:১১:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:11:56.540Z",
            "description": "🔧 Auto-Heal #102: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141056236_M4XZJ",
            "data": {
                "run": 413,
                "time": "৫:১০:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:10:56.236Z",
            "description": "🔧 Auto-Heal #413: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141019904_QQU1M",
            "data": {
                "run": 18,
                "time": "৫:১০:১৯ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:10:19.904Z",
            "description": "🔧 Auto-Heal #18: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141001804_0U8XY",
            "data": {
                "run": 412,
                "time": "৫:১০:০১ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:10:01.804Z",
            "description": "🔧 Auto-Heal #412: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773141000979_4R0RQ",
            "data": {
                "run": 100,
                "time": "৫:১০:০০ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:10:00.979Z",
            "description": "🔧 Auto-Heal #100: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140952154_X36G8",
            "data": {
                "run": 17,
                "time": "৫:০৯:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:09:12.154Z",
            "description": "🔧 Auto-Heal #17: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140936977_9TEHH",
            "data": {
                "run": 411,
                "time": "৫:০৮:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:08:56.977Z",
            "description": "🔧 Auto-Heal #411: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140936630_3PD8W",
            "data": {
                "run": 99,
                "time": "৫:০৮:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:08:56.630Z",
            "description": "🔧 Auto-Heal #99: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140918648_MF8UA",
            "data": {
                "run": 16,
                "time": "৫:০৮:৩৮ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:08:38.649Z",
            "description": "🔧 Auto-Heal #16: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140876650_OTPWY",
            "data": {
                "run": 410,
                "time": "৫:০৭:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:07:56.650Z",
            "description": "🔧 Auto-Heal #410: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140876619_VBTU9",
            "data": {
                "run": 98,
                "time": "৫:০৭:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:07:56.619Z",
            "description": "🔧 Auto-Heal #98: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140832472_QF58L",
            "data": {
                "run": 15,
                "time": "৫:০৭:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:07:12.472Z",
            "description": "🔧 Auto-Heal #15: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140816634_W79IN",
            "data": {
                "run": 409,
                "time": "৫:০৬:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:06:56.634Z",
            "description": "🔧 Auto-Heal #409: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140816506_9VLJM",
            "data": {
                "run": 97,
                "time": "৫:০৬:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:06:56.506Z",
            "description": "🔧 Auto-Heal #97: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140772484_UWQX6",
            "data": {
                "run": 14,
                "time": "৫:০৬:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:06:12.484Z",
            "description": "🔧 Auto-Heal #14: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140757257_Z489W",
            "data": {
                "run": 96,
                "time": "৫:০৫:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:05:57.257Z",
            "description": "🔧 Auto-Heal #96: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140757081_RFSSS",
            "data": {
                "run": 408,
                "time": "৫:০৫:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:05:57.081Z",
            "description": "🔧 Auto-Heal #408: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140712472_L1IID",
            "data": {
                "run": 13,
                "time": "৫:০৫:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:05:12.472Z",
            "description": "🔧 Auto-Heal #13: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140696923_W2ZUI",
            "data": {
                "run": 407,
                "time": "৫:০৪:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:04:56.923Z",
            "description": "🔧 Auto-Heal #407: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140696548_7PXY1",
            "data": {
                "run": 95,
                "time": "৫:০৪:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:04:56.548Z",
            "description": "🔧 Auto-Heal #95: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140661878_TZGJC",
            "data": {
                "run": 12,
                "time": "৫:০৪:২১ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:04:21.878Z",
            "description": "🔧 Auto-Heal #12: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140592488_SONY9",
            "data": {
                "run": 11,
                "time": "৫:০৩:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:03:12.488Z",
            "description": "🔧 Auto-Heal #11: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140576803_KOFA1",
            "data": {
                "run": 93,
                "time": "৫:০২:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:02:56.803Z",
            "description": "🔧 Auto-Heal #93: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140532480_BH9YY",
            "data": {
                "run": 10,
                "time": "৫:০২:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:02:12.480Z",
            "description": "🔧 Auto-Heal #10: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140516751_W6YKM",
            "data": {
                "run": 404,
                "time": "৫:০১:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:01:56.751Z",
            "description": "🔧 Auto-Heal #404: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140516574_8DDN0",
            "data": {
                "run": 92,
                "time": "৫:০১:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:01:56.574Z",
            "description": "🔧 Auto-Heal #92: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140472184_UI6MB",
            "data": {
                "run": 9,
                "time": "৫:০১:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:01:12.185Z",
            "description": "🔧 Auto-Heal #9: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140457115_JBGWS",
            "data": {
                "run": 403,
                "time": "৫:০০:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:00:57.115Z",
            "description": "🔧 Auto-Heal #403: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140456629_BYJ76",
            "data": {
                "run": 91,
                "time": "৫:০০:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:00:56.629Z",
            "description": "🔧 Auto-Heal #91: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140412137_81QCQ",
            "data": {
                "run": 8,
                "time": "৫:০০:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T11:00:12.137Z",
            "description": "🔧 Auto-Heal #8: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140397074_5B9RP",
            "data": {
                "run": 90,
                "time": "৪:৫৯:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:59:57.074Z",
            "description": "🔧 Auto-Heal #90: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140396834_OIGAW",
            "data": {
                "run": 402,
                "time": "৪:৫৯:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:59:56.834Z",
            "description": "🔧 Auto-Heal #402: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140352164_OC3B8",
            "data": {
                "run": 7,
                "time": "৪:৫৯:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:59:12.164Z",
            "description": "🔧 Auto-Heal #7: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140337009_DS2WM",
            "data": {
                "run": 401,
                "time": "৪:৫৮:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:58:57.009Z",
            "description": "🔧 Auto-Heal #401: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140336595_PF7A6",
            "data": {
                "run": 89,
                "time": "৪:৫৮:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:58:56.595Z",
            "description": "🔧 Auto-Heal #89: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140292281_51HAD",
            "data": {
                "run": 6,
                "time": "৪:৫৮:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:58:12.281Z",
            "description": "🔧 Auto-Heal #6: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140278077_9WVOF",
            "data": {
                "run": 88,
                "time": "৪:৫৭:৫৮ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:57:58.077Z",
            "description": "🔧 Auto-Heal #88: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140277726_EG8XP",
            "data": {
                "run": 400,
                "time": "৪:৫৭:৫৭ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:57:57.726Z",
            "description": "🔧 Auto-Heal #400: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140232135_M0W7D",
            "data": {
                "run": 5,
                "time": "৪:৫৭:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:57:12.135Z",
            "description": "🔧 Auto-Heal #5: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140216979_EEIUW",
            "data": {
                "run": 87,
                "time": "৪:৫৬:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:56:56.979Z",
            "description": "🔧 Auto-Heal #87: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140216496_7WG46",
            "data": {
                "run": 399,
                "time": "৪:৫৬:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:56:56.496Z",
            "description": "🔧 Auto-Heal #399: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140172152_T993C",
            "data": {
                "run": 4,
                "time": "৪:৫৬:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:56:12.152Z",
            "description": "🔧 Auto-Heal #4: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140156818_Z3XNX",
            "data": {
                "run": 398,
                "time": "৪:৫৫:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:55:56.818Z",
            "description": "🔧 Auto-Heal #398: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140156542_Z7IQ6",
            "data": {
                "run": 86,
                "time": "৪:৫৫:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:55:56.543Z",
            "description": "🔧 Auto-Heal #86: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140112306_1M5A7",
            "data": {
                "run": 3,
                "time": "৪:৫৫:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:55:12.306Z",
            "description": "🔧 Auto-Heal #3: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140097619_IQK6T",
            "data": {
                "run": 397,
                "time": "৪:৫৪:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:54:57.619Z",
            "description": "🔧 Auto-Heal #397: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140096849_H3QE0",
            "data": {
                "run": 85,
                "time": "৪:৫৪:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:54:56.849Z",
            "description": "🔧 Auto-Heal #85: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140052323_GC5RC",
            "data": {
                "run": 2,
                "time": "৪:৫৪:১২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:54:12.323Z",
            "description": "🔧 Auto-Heal #2: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140036928_LMQIY",
            "data": {
                "run": 396,
                "time": "৪:৫৩:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:53:56.928Z",
            "description": "🔧 Auto-Heal #396: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140036561_V6A12",
            "data": {
                "run": 84,
                "time": "৪:৫৩:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:53:56.561Z",
            "description": "🔧 Auto-Heal #84: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773140002188_70ZHE",
            "data": {
                "run": 1,
                "time": "৪:৫৩:২২ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:53:22.188Z",
            "description": "🔧 Auto-Heal #1: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139987926_KAMWT",
            "data": {
                "run": 1,
                "time": "৪:৫৩:০৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:53:07.926Z",
            "description": "🔧 Auto-Heal #1: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139982820_NOFXB",
            "data": {},
            "type": "login",
            "user": "Admin",
            "action": "LOGIN",
            "timestamp": "2026-03-10T10:53:02.820Z",
            "description": "User logged in: Admin"
        },
        {
            "id": "ACT_1773139978009_A7U13",
            "data": {
                "run": 395,
                "time": "৪:৫২:৫৮ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:52:58.009Z",
            "description": "🔧 Auto-Heal #395: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139976878_P1QLD",
            "data": {
                "run": 83,
                "time": "৪:৫২:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:52:56.878Z",
            "description": "🔧 Auto-Heal #83: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139916760_GLTM7",
            "data": {
                "run": 394,
                "time": "৪:৫১:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:51:56.760Z",
            "description": "🔧 Auto-Heal #394: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139916491_N8DPK",
            "data": {
                "run": 82,
                "time": "৪:৫১:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:51:56.491Z",
            "description": "🔧 Auto-Heal #82: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139857015_UXCYQ",
            "data": {
                "run": 81,
                "time": "৪:৫০:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:50:57.015Z",
            "description": "🔧 Auto-Heal #81: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139856899_SOU1Z",
            "data": {
                "run": 393,
                "time": "৪:৫০:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:50:56.899Z",
            "description": "🔧 Auto-Heal #393: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139796829_43GPA",
            "data": {
                "run": 392,
                "time": "৪:৪৯:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:49:56.829Z",
            "description": "🔧 Auto-Heal #392: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139796511_4PMMW",
            "data": {
                "run": 80,
                "time": "৪:৪৯:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:49:56.511Z",
            "description": "🔧 Auto-Heal #80: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139736880_Y31HI",
            "data": {
                "run": 391,
                "time": "৪:৪৮:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:48:56.880Z",
            "description": "🔧 Auto-Heal #391: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139736544_KD74X",
            "data": {
                "run": 79,
                "time": "৪:৪৮:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:48:56.544Z",
            "description": "🔧 Auto-Heal #79: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139676996_9LD7K",
            "data": {
                "run": 78,
                "time": "৪:৪৭:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:47:56.996Z",
            "description": "🔧 Auto-Heal #78: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139676909_UAN22",
            "data": {
                "run": 390
            },
            "type": "test",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:47:56.909Z",
            "description": "✅ Auto-Heal #390: সব ঠিক আছে"
        },
        {
            "id": "ACT_1773139616583_8D6JO",
            "data": {
                "run": 389,
                "time": "৪:৪৬:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:46:56.583Z",
            "description": "🔧 Auto-Heal #389: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139616554_Y7P34",
            "data": {
                "run": 77,
                "time": "৪:৪৬:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:46:56.554Z",
            "description": "🔧 Auto-Heal #77: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139557483_76C65",
            "data": {
                "run": 76,
                "time": "৪:৪৫:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:45:57.483Z",
            "description": "🔧 Auto-Heal #76: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139557286_PB73F",
            "data": {
                "run": 388,
                "time": "৪:৪৫:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:45:57.286Z",
            "description": "🔧 Auto-Heal #388: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139497236_G5BRY",
            "data": {
                "run": 75,
                "time": "৪:৪৪:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:44:57.236Z",
            "description": "🔧 Auto-Heal #75: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139496988_M8LAX",
            "data": {
                "run": 387,
                "time": "৪:৪৪:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:44:56.988Z",
            "description": "🔧 Auto-Heal #387: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139437532_FD91Q",
            "data": {
                "run": 74,
                "time": "৪:৪৩:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:43:57.532Z",
            "description": "🔧 Auto-Heal #74: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139437419_YPTUV",
            "data": {
                "run": 386,
                "time": "৪:৪৩:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:43:57.419Z",
            "description": "🔧 Auto-Heal #386: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139377256_J6T3D",
            "data": {
                "run": 73,
                "time": "৪:৪২:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:42:57.256Z",
            "description": "🔧 Auto-Heal #73: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139377197_Q0XYZ",
            "data": {
                "run": 385,
                "time": "৪:৪২:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:42:57.197Z",
            "description": "🔧 Auto-Heal #385: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139317137_SX932",
            "data": {
                "run": 72,
                "time": "৪:৪১:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:41:57.137Z",
            "description": "🔧 Auto-Heal #72: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139317000_K79YT",
            "data": {
                "run": 384,
                "time": "৪:৪১:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:41:57.000Z",
            "description": "🔧 Auto-Heal #384: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139257130_H70PL",
            "data": {
                "run": 71,
                "time": "৪:৪০:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:40:57.130Z",
            "description": "🔧 Auto-Heal #71: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139257034_0TM58",
            "data": {
                "run": 383,
                "time": "৪:৪০:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:40:57.034Z",
            "description": "🔧 Auto-Heal #383: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139197778_QHS70",
            "data": {
                "run": 70,
                "time": "৪:৩৯:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:39:57.778Z",
            "description": "🔧 Auto-Heal #70: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139197682_JAE9Y",
            "data": {
                "run": 382,
                "time": "৪:৩৯:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:39:57.682Z",
            "description": "🔧 Auto-Heal #382: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139137624_QXGPW",
            "data": {
                "run": 69,
                "time": "৪:৩৮:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:38:57.624Z",
            "description": "🔧 Auto-Heal #69: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139137292_SQ05X",
            "data": {
                "run": 381,
                "time": "৪:৩৮:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:38:57.292Z",
            "description": "🔧 Auto-Heal #381: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139077023_FWT8R",
            "data": {
                "run": 380,
                "time": "৪:৩৭:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:37:57.023Z",
            "description": "🔧 Auto-Heal #380: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139063115_DOMR5",
            "data": {
                "run": 68,
                "time": "৪:৩৭:৪৩ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:37:43.115Z",
            "description": "🔧 Auto-Heal #68: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139017216_8X5FF",
            "data": {
                "run": 67,
                "time": "৪:৩৬:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:36:57.216Z",
            "description": "🔧 Auto-Heal #67: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773139017013_MGOYJ",
            "data": {
                "run": 379,
                "time": "৪:৩৬:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:36:57.013Z",
            "description": "🔧 Auto-Heal #379: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138956931_R38UC",
            "data": {
                "run": 378,
                "time": "৪:৩৫:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:35:56.931Z",
            "description": "🔧 Auto-Heal #378: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138956661_N50HN",
            "data": {
                "run": 66,
                "time": "৪:৩৫:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:35:56.661Z",
            "description": "🔧 Auto-Heal #66: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138897073_J0YKM",
            "data": {
                "run": 377,
                "time": "৪:৩৪:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:34:57.073Z",
            "description": "🔧 Auto-Heal #377: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138896620_7QOV4",
            "data": {
                "run": 65,
                "time": "৪:৩৪:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:34:56.621Z",
            "description": "🔧 Auto-Heal #65: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138837622_WQUPR",
            "data": {
                "run": 64,
                "time": "৪:৩৩:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:33:57.622Z",
            "description": "🔧 Auto-Heal #64: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138837378_A4HOZ",
            "data": {
                "run": 376,
                "time": "৪:৩৩:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:33:57.378Z",
            "description": "🔧 Auto-Heal #376: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138777260_D7VQ9",
            "data": {
                "run": 63,
                "time": "৪:৩২:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:32:57.260Z",
            "description": "🔧 Auto-Heal #63: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138777092_MSBYP",
            "data": {
                "run": 375,
                "time": "৪:৩২:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:32:57.092Z",
            "description": "🔧 Auto-Heal #375: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138717458_996ES",
            "data": {
                "run": 62,
                "time": "৪:৩১:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:31:57.458Z",
            "description": "🔧 Auto-Heal #62: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138717286_FFVX1",
            "data": {
                "run": 374,
                "time": "৪:৩১:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:31:57.286Z",
            "description": "🔧 Auto-Heal #374: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138657170_UUDMH",
            "data": {
                "run": 61,
                "time": "৪:৩০:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:30:57.170Z",
            "description": "🔧 Auto-Heal #61: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138656896_URGEX",
            "data": {
                "run": 373,
                "time": "৪:৩০:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:30:56.896Z",
            "description": "🔧 Auto-Heal #373: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138597131_6G5E1",
            "data": {
                "run": 372,
                "time": "৪:২৯:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:29:57.131Z",
            "description": "🔧 Auto-Heal #372: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138596720_YDW0S",
            "data": {
                "run": 60,
                "time": "৪:২৯:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:29:56.720Z",
            "description": "🔧 Auto-Heal #60: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138536956_PZX04",
            "data": {
                "run": 371,
                "time": "৪:২৮:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:28:56.956Z",
            "description": "🔧 Auto-Heal #371: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138536715_H1UGH",
            "data": {
                "run": 59,
                "time": "৪:২৮:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:28:56.715Z",
            "description": "🔧 Auto-Heal #59: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138477195_VOMU0",
            "data": {
                "run": 58,
                "time": "৪:২৭:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:27:57.195Z",
            "description": "🔧 Auto-Heal #58: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138476993_RF5CN",
            "data": {
                "run": 370,
                "time": "৪:২৭:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:27:56.993Z",
            "description": "🔧 Auto-Heal #370: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138417001_RHH7N",
            "data": {
                "run": 369,
                "time": "৪:২৬:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:26:57.001Z",
            "description": "🔧 Auto-Heal #369: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138416797_V081K",
            "data": {
                "run": 57,
                "time": "৪:২৬:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:26:56.797Z",
            "description": "🔧 Auto-Heal #57: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138357039_L6XHC",
            "data": {
                "run": 368,
                "time": "৪:২৫:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:25:57.039Z",
            "description": "🔧 Auto-Heal #368: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138356677_O8CI4",
            "data": {
                "run": 56,
                "time": "৪:২৫:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:25:56.677Z",
            "description": "🔧 Auto-Heal #56: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138296937_TLH0Y",
            "data": {
                "run": 367,
                "time": "৪:২৪:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:24:56.937Z",
            "description": "🔧 Auto-Heal #367: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138296602_JKRYV",
            "data": {
                "run": 55,
                "time": "৪:২৪:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:24:56.602Z",
            "description": "🔧 Auto-Heal #55: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138236900_0MAXK",
            "data": {
                "run": 366,
                "time": "৪:২৩:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:23:56.900Z",
            "description": "🔧 Auto-Heal #366: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138236605_ATR7C",
            "data": {
                "run": 54,
                "time": "৪:২৩:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:23:56.605Z",
            "description": "🔧 Auto-Heal #54: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138176948_ZCNQO",
            "data": {
                "run": 365,
                "time": "৪:২২:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:22:56.948Z",
            "description": "🔧 Auto-Heal #365: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138176521_JHO9P",
            "data": {
                "run": 53,
                "time": "৪:২২:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:22:56.521Z",
            "description": "🔧 Auto-Heal #53: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138117151_CQCH3",
            "data": {
                "run": 364,
                "time": "৪:২১:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:21:57.151Z",
            "description": "🔧 Auto-Heal #364: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138056829_UDJ66",
            "data": {
                "run": 363,
                "time": "৪:২০:৫৬ PM",
                "fixes": 1
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:20:56.829Z",
            "description": "🔧 Auto-Heal #363: 1টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773138056598_OWJRS",
            "data": {
                "run": 51,
                "time": "৪:২০:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:20:56.598Z",
            "description": "🔧 Auto-Heal #51: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137996632_XIOEF",
            "data": {
                "run": 50,
                "time": "৪:১৯:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:19:56.632Z",
            "description": "🔧 Auto-Heal #50: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137996580_Q3S0D",
            "data": {
                "run": 362,
                "time": "৪:১৯:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:19:56.581Z",
            "description": "🔧 Auto-Heal #362: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137936936_51H7D",
            "data": {
                "run": 361,
                "time": "৪:১৮:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:18:56.936Z",
            "description": "🔧 Auto-Heal #361: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137936930_QQR1H",
            "data": {
                "run": 49,
                "time": "৪:১৮:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:18:56.931Z",
            "description": "🔧 Auto-Heal #49: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137877063_5YHML",
            "data": {
                "run": 360,
                "time": "৪:১৭:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:17:57.063Z",
            "description": "🔧 Auto-Heal #360: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137876715_0RX18",
            "data": {
                "run": 48,
                "time": "৪:১৭:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:17:56.715Z",
            "description": "🔧 Auto-Heal #48: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137816924_55VJQ",
            "data": {
                "run": 359,
                "time": "৪:১৬:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:16:56.924Z",
            "description": "🔧 Auto-Heal #359: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137816604_3FBDQ",
            "data": {
                "run": 47,
                "time": "৪:১৬:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:16:56.604Z",
            "description": "🔧 Auto-Heal #47: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137757373_KONZM",
            "data": {
                "run": 46,
                "time": "৪:১৫:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:15:57.373Z",
            "description": "🔧 Auto-Heal #46: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137757297_GID9R",
            "data": {
                "run": 358,
                "time": "৪:১৫:৫৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:15:57.297Z",
            "description": "🔧 Auto-Heal #358: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137697055_V84A0",
            "data": {
                "run": 45,
                "time": "৪:১৪:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:14:57.055Z",
            "description": "🔧 Auto-Heal #45: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137696838_ZA3P5",
            "data": {
                "run": 357,
                "time": "৪:১৪:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:14:56.838Z",
            "description": "🔧 Auto-Heal #357: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137636903_V8IN0",
            "data": {
                "run": 356,
                "time": "৪:১৩:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:13:56.903Z",
            "description": "🔧 Auto-Heal #356: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137636582_7OXCP",
            "data": {
                "run": 44,
                "time": "৪:১৩:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:13:56.582Z",
            "description": "🔧 Auto-Heal #44: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137577354_00YK5",
            "data": {
                "run": 43,
                "time": "৪:১২:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:12:57.354Z",
            "description": "🔧 Auto-Heal #43: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137577169_3ZR4F",
            "data": {
                "run": 355,
                "time": "৪:১২:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:12:57.169Z",
            "description": "🔧 Auto-Heal #355: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137516848_7SOTM",
            "data": {
                "run": 354,
                "time": "৪:১১:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:11:56.848Z",
            "description": "🔧 Auto-Heal #354: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137516564_14C96",
            "data": {
                "run": 42,
                "time": "৪:১১:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:11:56.564Z",
            "description": "🔧 Auto-Heal #42: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137457145_R4PSJ",
            "data": {
                "run": 41,
                "time": "৪:১০:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:10:57.145Z",
            "description": "🔧 Auto-Heal #41: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137456991_GOH09",
            "data": {
                "run": 353,
                "time": "৪:১০:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:10:56.991Z",
            "description": "🔧 Auto-Heal #353: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137397037_YSBPD",
            "data": {
                "run": 352,
                "time": "৪:০৯:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:09:57.037Z",
            "description": "🔧 Auto-Heal #352: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137396680_BDD1Z",
            "data": {
                "run": 40
            },
            "type": "test",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:09:56.680Z",
            "description": "✅ Auto-Heal #40: সব ঠিক আছে"
        },
        {
            "id": "ACT_1773137357486_34EQH",
            "data": {
                "run": 351,
                "time": "৪:০৯:১৭ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:09:17.486Z",
            "description": "🔧 Auto-Heal #351: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137156982_JBFF5",
            "data": {
                "run": 350,
                "time": "৪:০৫:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:05:56.982Z",
            "description": "🔧 Auto-Heal #350: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137156563_4YHII",
            "data": {
                "run": 38,
                "time": "৪:০৫:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:05:56.563Z",
            "description": "🔧 Auto-Heal #38: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137096871_NMCZI",
            "data": {
                "run": 349,
                "time": "৪:০৪:৫৬ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:04:56.871Z",
            "description": "🔧 Auto-Heal #349: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137096523_307HD",
            "data": {
                "run": 37,
                "time": "৪:০৪:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:04:56.523Z",
            "description": "🔧 Auto-Heal #37: 12টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137037022_L01EB",
            "data": {
                "run": 348,
                "time": "৪:০৩:৫৭ PM",
                "fixes": 13
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:03:57.022Z",
            "description": "🔧 Auto-Heal #348: 13টি সমস্যা fix হয়েছে"
        },
        {
            "id": "ACT_1773137036697_I0U58",
            "data": {
                "run": 36,
                "time": "৪:০৩:৫৬ PM",
                "fixes": 12
            },
            "type": "fix",
            "user": "Admin",
            "action": "HEAL",
            "timestamp": "2026-03-10T10:03:56.697Z",
            "description": "🔧 Auto-Heal #36: 12টি সমস্যা fix হয়েছে"
        }
    ],
    "credentials": {
        "username": "admin",
        "password": "e7d3bfb67567c3d94bcecb2ce65ef146eac83e50dc3f3b89e81bb647a8bada4c"
    },
    "keepRecords": [],
    "loans": [],
    "idCards": [],
    "notices": [],
    "breakdownRecords": []
};

    function restore() {
        // ✅ MIGRATION LOCK (March 2026):
        // নতুন Supabase account এ migrate করা হয়েছে।
        // এই backup file টি পুরানো account এর data (Feb 22 backup)।
        // এটা আর auto-restore করা যাবে না — নতুন cloud এ latest data আছে।
        //
        // Manual emergency restore প্রয়োজন হলে browser console এ টাইপ করুন:
        // window.emergencyRestoreManual()

        console.log('🔒 EMERGENCY_RESTORE: Migration lock active — auto-restore disabled.');
        console.log('   নতুন Supabase account active। Cloud থেকে data load হবে।');

        window.emergencyRestoreManual = function() {
            const rawData = localStorage.getItem('wingsfly_data');
            const currentData = JSON.parse(rawData || '{}');
            const currentStudents = (currentData.students || []).length;
            const msg = '⚠️ Emergency Restore!\n\nবর্তমান students: ' + currentStudents + ' জন\nBackup এ students: ' + (backupData.students||[]).length + ' জন\n\nএই restore করলে বর্তমান সব data মুছে যাবে!\nShould u proceed?';
            if (confirm(msg)) {
                localStorage.setItem('wingsfly_data', JSON.stringify(backupData));
                localStorage.setItem('wings_local_version', '0');
                console.log('Manual restore complete. Reloading...');
                window.location.reload();
            }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', restore);
    } else {
        restore();
    }
})();

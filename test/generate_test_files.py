#!/usr/bin/env python3
"""Generate test xlsx and CSV files for testing Go file parser."""

from openpyxl import Workbook
import csv
import os

# Change to test directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))


# Generate xlsx file
def generate_xlsx():
    wb = Workbook()
    ws = wb.active
    ws.title = "Jobs"

    # Headers
    headers = ["Job ID", "Title", "Company", "Location", "Salary", "Requirements"]
    ws.append(headers)

    # Data rows
    jobs = [
        [
            "1",
            "Software Engineer",
            "Tech Corp",
            "Beijing",
            "15K-25K",
            "Go, Python, SQL",
        ],
        ["2", "Product Manager", "Startup Inc", "Shanghai", "20K-30K", "Agile, Jira"],
        ["3", "Data Analyst", "Data Co", "Beijing", "10K-18K", "Python, SQL, Excel"],
        ["4", "UX Designer", "Design Studio", "Remote", "12K-20K", "Figma, Sketch"],
        ["5", "DevOps Engineer", "Cloud Tech", "Shenzhen", "18K-28K", "K8s, Docker"],
    ]
    for job in jobs:
        ws.append(job)

    # Add second sheet
    ws2 = wb.create_sheet(title="Students")
    student_headers = ["Student ID", "Name", "Major", "Grade", "Skills", "GPA"]
    ws2.append(student_headers)

    students = [
        ["1001", "Zhang San", "Computer Science", "Senior", "Python, Java", "3.5"],
        ["1002", "Li Si", "Data Science", "Junior", "SQL, R", "3.8"],
        ["1003", "Wang Wu", "Business", "Senior", "Excel, PPT", "3.2"],
        ["1004", "Zhao Liu", "Design", "Sophomore", "Figma, PS", "3.6"],
    ]
    for student in students:
        ws2.append(student)

    wb.save("test_jobs_students.xlsx")
    print("Generated: test_jobs_students.xlsx")


# Generate CSV file
def generate_csv():
    with open("test_data.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        # Header
        writer.writerow(["ID", "Name", "Department", "Position", "Salary", "JoinDate"])
        # Data rows
        records = [
            [
                "EMP001",
                "Zhang Wei",
                "Engineering",
                "Senior Developer",
                "25000",
                "2023-01-15",
            ],
            [
                "EMP002",
                "Li Ming",
                "Marketing",
                "Marketing Manager",
                "20000",
                "2022-06-01",
            ],
            ["EMP003", "Wang Qiang", "Sales", "Sales Director", "30000", "2021-03-20"],
            ["EMP004", "Liu Fang", "HR", "HR Manager", "18000", "2022-09-10"],
            [
                "EMP005",
                "Chen Jie",
                "Finance",
                "Financial Analyst",
                "15000",
                "2023-07-01",
            ],
        ]
        for record in records:
            writer.writerow(record)
    print("Generated: test_data.csv")


if __name__ == "__main__":
    generate_xlsx()
    generate_csv()
    print("All test files generated!")

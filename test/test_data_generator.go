package main

import (
	"encoding/csv"
	"fmt"
	"os"

	"github.com/unidoc/unioffice/spreadsheet"
)

func main() {
	// Generate test xlsx file
	generateTestXLSX()

	// Generate test CSV file
	generateTestCSV()

	fmt.Println("Test files generated successfully!")
}

func generateTestXLSX() {
	ss := spreadsheet.New()
	defer ss.Close()

	// Sheet 1: Job data
	sheet1 := ss.AddSheet()
	sheet1.SetName("Jobs")

	// Headers in row 1
	jobs := [][]string{
		{"Job ID", "Title", "Company", "Location", "Salary", "Requirements"},
		{"1", "Software Engineer", "Tech Corp", "Beijing", "15K-25K", "Go, Python, SQL"},
		{"2", "Product Manager", "Startup Inc", "Shanghai", "20K-30K", "Agile, Jira"},
		{"3", "Data Analyst", "Data Co", "Beijing", "10K-18K", "Python, SQL, Excel"},
		{"4", "UX Designer", "Design Studio", "Remote", "12K-20K", "Figma, Sketch"},
		{"5", "DevOps Engineer", "Cloud Tech", "Shenzhen", "18K-28K", "K8s, Docker"},
	}

	for rowIdx, row := range jobs {
		for colIdx, value := range row {
			cellRef := fmt.Sprintf("%c%d", 'A'+colIdx, rowIdx+1)
			cell := sheet1.Cell(cellRef)
			cell.SetString(value)
		}
	}

	// Save to file
	f, err := os.Create("test_jobs_students.xlsx")
	if err != nil {
		fmt.Printf("Error creating xlsx: %v\n", err)
		return
	}
	defer f.Close()

	if err := ss.Save(f); err != nil {
		fmt.Printf("Error saving xlsx: %v\n", err)
	}

	fmt.Println("Generated: test_jobs_students.xlsx")
}

func generateTestCSV() {
	f, err := os.Create("test_data.csv")
	if err != nil {
		fmt.Printf("Error creating CSV: %v\n", err)
		return
	}
	defer f.Close()

	writer := csv.NewWriter(f)
	defer writer.Flush()

	// Header
	headers := []string{"ID", "Name", "Department", "Position", "Salary", "JoinDate"}
	writer.Write(headers)

	// Data rows
	records := [][]string{
		{"EMP001", "Zhang Wei", "Engineering", "Senior Developer", "25000", "2023-01-15"},
		{"EMP002", "Li Ming", "Marketing", "Marketing Manager", "20000", "2022-06-01"},
		{"EMP003", "Wang Qiang", "Sales", "Sales Director", "30000", "2021-03-20"},
		{"EMP004", "Liu Fang", "HR", "HR Manager", "18000", "2022-09-10"},
		{"EMP005", "Chen Jie", "Finance", "Financial Analyst", "15000", "2023-07-01"},
	}

	for _, record := range records {
		writer.Write(record)
	}

	fmt.Println("Generated: test_data.csv")
}

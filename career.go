package main

import (
	"database/sql"
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest"

	"career-api/internal/config"
	"career-api/internal/handler"
	"career-api/internal/svc"
)

var configFile = flag.String("f", "etc/career-api.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)

	if err := autoMigrate(c.Mysql.DataSource); err != nil {
		logx.Errorf("Auto migration failed: %v", err)
		os.Exit(1)
	}

	server := rest.MustNewServer(c.RestConf, rest.WithCors())
	defer server.Stop()

	ctx := svc.NewServiceContext(&c)
	handler.RegisterHandlers(server, ctx)

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}

func autoMigrate(dataSource string) error {
	idx := strings.Index(dataSource, "/")
	if idx == -1 {
		return fmt.Errorf("invalid datasource format")
	}

	prefix := dataSource[:idx]
	rest := dataSource[idx+1:]

	queryIdx := strings.Index(rest, "?")
	var dbName string
	if queryIdx == -1 {
		dbName = rest
	} else {
		dbName = rest[:queryIdx]
	}

	baseDSN := prefix + "/"

	db, err := sql.Open("mysql", baseDSN)
	if err != nil {
		return fmt.Errorf("failed to connect to mysql: %w", err)
	}
	defer db.Close()

	if _, err := db.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName)); err != nil {
		return fmt.Errorf("failed to create database: %w", err)
	}
	logx.Infof("Database %s ensured", dbName)

	db.Close()

	db, err = sql.Open("mysql", dataSource)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

	schema, err := os.ReadFile("sql/schema.sql")
	if err != nil {
		return fmt.Errorf("failed to read schema file: %w", err)
	}

	statements := strings.Split(string(schema), ";")
	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}
		if _, err := db.Exec(stmt); err != nil {
			return fmt.Errorf("failed to execute schema: %w", err)
		}
	}

	logx.Infof("Database migration completed")
	return nil
}

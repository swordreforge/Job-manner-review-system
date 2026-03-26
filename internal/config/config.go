package config

import "github.com/zeromicro/go-zero/rest"

type Config struct {
	rest.RestConf

	Mysql struct {
		DataSource      string
		MaxOpenConns    int
		MaxIdleConns    int
		ConnMaxLifetime int
	}

	Redis struct {
		Host     string
		Pass     string
		Type     string
		DB       int
		PoolSize int
	}

	CacheRedis struct {
		Host     string
		Pass     string
		DB       int
		PoolSize int
	}

	Auth struct {
		AccessSecret string
		AccessExpire int64
	}

	AI struct {
		Provider string
		ApiKey   string
		Model    string
		BaseURL  string
		Timeout  int
	}

	RateLimit struct {
		TokensPerSecond int
		Burst           int
	}

	CircuitBreaker struct {
		ForceOpen             bool
		SleepWindow           int
		ErrorPercentThreshold int
	}
}

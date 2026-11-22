package cache

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	client *redis.Client
}

var Cache *RedisClient

func InitRedis(redisURL string) *RedisClient {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		opts = &redis.Options{
			Addr: redisURL,
		}
	}

	rdb := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("[WARN] Redis is unreachable at %s: %v. Cache fallback to direct DB queries will be active.\n", redisURL, err)
		Cache = &RedisClient{client: nil}
		return Cache
	}

	log.Println("Redis connected successfully.")
	Cache = &RedisClient{client: rdb}
	return Cache
}

func (r *RedisClient) IsAvailable() bool {
	return r != nil && r.client != nil
}

func (r *RedisClient) SetJSON(ctx context.Context, key string, data interface{}, ttl time.Duration) error {
	if !r.IsAvailable() {
		return nil
	}

	bytes, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return r.client.Set(ctx, key, bytes, ttl).Err()
}

func (r *RedisClient) GetJSON(ctx context.Context, key string, dest interface{}) (bool, error) {
	if !r.IsAvailable() {
		return false, nil
	}

	val, err := r.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return false, nil
	} else if err != nil {
		return false, err
	}

	if err := json.Unmarshal([]byte(val), dest); err != nil {
		return false, err
	}

	return true, nil
}

func (r *RedisClient) Delete(ctx context.Context, keys ...string) error {
	if !r.IsAvailable() || len(keys) == 0 {
		return nil
	}
	return r.client.Del(ctx, keys...).Err()
}

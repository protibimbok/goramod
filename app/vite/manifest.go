package vite

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
)

type chunk struct {
	File    string   `json:"file"`
	CSS     []string `json:"css"`
	Imports []string `json:"imports"`
}

type signature struct {
	modTimeNS int64
	size      int64
}

func fileSignature(path string) (signature, bool) {
	info, err := os.Stat(path)
	if err != nil {
		return signature{}, false
	}
	return signature{modTimeNS: info.ModTime().UnixNano(), size: info.Size()}, true
}

type manifestCache struct {
	mu        sync.Mutex
	signature signature
	entries   map[string]*chunk
	loaded    bool
}

func (m *manifestCache) load(path string) (map[string]*chunk, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	current, exists := fileSignature(path)
	if !exists {
		m.loaded = false
		return nil, fmt.Errorf("vite: the build manifest was not found at %s — run `vite build`, or start the dev server", path)
	}
	if m.loaded && current == m.signature {
		return m.entries, nil
	}

	content, err := os.ReadFile(path)
	if err != nil {
		m.loaded = false
		return nil, fmt.Errorf("vite: cannot read the build manifest at %s: %w", path, err)
	}
	var entries map[string]*chunk
	if err := json.Unmarshal(content, &entries); err != nil {
		m.loaded = false
		return nil, fmt.Errorf("vite: the build manifest at %s is not valid JSON: %w", path, err)
	}

	m.signature = current
	m.entries = entries
	m.loaded = true
	return entries, nil
}

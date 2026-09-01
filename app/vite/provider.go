package vite

import (
	"html/template"
	"sync"

	"github.com/goravel/framework/contracts/binding"
	"github.com/goravel/framework/contracts/config"
	"github.com/goravel/framework/contracts/foundation"
)

// Binding is the container key the renderer is registered under.
const Binding = "goravel.vite"

var (
	defaultMu   sync.RWMutex
	defaultVite *Vite
)

func Default() *Vite {
	defaultMu.RLock()
	v := defaultVite
	defaultMu.RUnlock()
	if v != nil {
		return v
	}
	defaultMu.Lock()
	defer defaultMu.Unlock()
	if defaultVite == nil {
		defaultVite = New(Config{})
	}
	return defaultVite
}

func SetDefault(v *Vite) {
	defaultMu.Lock()
	defaultVite = v
	defaultMu.Unlock()
}

func Tags(entries ...string) (template.HTML, error) {
	return Default().Tags(entries...)
}

func FuncMap() template.FuncMap {
	return template.FuncMap{
		"vite": Tags,
	}
}

func NewFromConfig(cfg config.Config) *Vite {
	if cfg == nil {
		return New(Config{})
	}
	return New(Config{
		BuildDir:       cfg.GetString("vite.build_dir"),
		HotFile:        cfg.GetString("vite.hot_file"),
		BuildURLPrefix: cfg.GetString("vite.build_url_prefix"),
		Modules:        cfg.GetBool("vite.modules"),
		ModulesDir:     cfg.GetString("vite.modules_dir"),
	})
}

type ServiceProvider struct{}

func (r *ServiceProvider) Relationship() binding.Relationship {
	return binding.Relationship{
		Bindings:     []string{Binding},
		Dependencies: []string{binding.Config},
	}
}

func (r *ServiceProvider) Register(app foundation.Application) {
	app.Singleton(Binding, func(app foundation.Application) (any, error) {
		return NewFromConfig(app.MakeConfig()), nil
	})
	SetDefault(NewFromConfig(app.MakeConfig()))
}

func (r *ServiceProvider) Boot(app foundation.Application) {}

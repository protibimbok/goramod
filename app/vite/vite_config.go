package vite

import (
	"path"
	"strings"
)

const (
	publicDir    = "public"
	resourcesDir = "resources/js"
	wsClient     = "@vite/client"
)

type Config struct {
	BuildDir       string
	HotFile        string
	BuildURLPrefix string
	Modules        bool
	ModulesDir     string
	JSAttrs        map[string]string
	CSSAttrs       map[string]string
}

func (c Config) withDefaults() Config {
	if c.BuildDir == "" {
		c.BuildDir = "build"
	}
	if c.HotFile == "" {
		c.HotFile = path.Join(publicDir, "hot")
	}
	if c.BuildURLPrefix == "" {
		c.BuildURLPrefix = "/public/" + strings.Trim(c.BuildDir, "/") + "/"
	}
	if !strings.HasSuffix(c.BuildURLPrefix, "/") {
		c.BuildURLPrefix += "/"
	}
	if c.ModulesDir == "" {
		c.ModulesDir = "modules"
	}
	if c.JSAttrs == nil {
		c.JSAttrs = map[string]string{"type": "module"}
	}
	if c.CSSAttrs == nil {
		c.CSSAttrs = map[string]string{"rel": "stylesheet"}
	}
	return c
}

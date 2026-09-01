package vite

import (
	"fmt"
	"html/template"
	"os"
	"path"
	"regexp"
	"strings"
)

type Vite struct {
	config       Config
	manifestPath string
	jsAttrs      string
	cssAttrs     string
	manifest     manifestCache
}

func New(config Config) *Vite {
	config = config.withDefaults()
	return &Vite{
		config:       config,
		manifestPath: path.Join(publicDir, config.BuildDir, ".vite", "manifest.json"),
		jsAttrs:      makeAttrs(config.JSAttrs),
		cssAttrs:     makeAttrs(config.CSSAttrs),
	}
}

var isCSS = regexp.MustCompile(`\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)($|\?)`)

const ReactRefreshEntry = "react"

func (v *Vite) Tags(entries ...string) (template.HTML, error) {
	if len(entries) == 0 {
		return "", fmt.Errorf("vite: no entry points given")
	}
	if v.DevMode() {
		return v.devTags(entries)
	}
	return v.buildTags(entries)
}

func (v *Vite) DevMode() bool {
	_, err := os.Stat(v.config.HotFile)
	return err == nil
}

func (v *Vite) DevServerURL() (string, error) {
	content, err := os.ReadFile(v.config.HotFile)
	if err != nil {
		return "", fmt.Errorf("vite: the dev server is not running (no hot file at %s): %w", v.config.HotFile, err)
	}
	return strings.TrimRight(strings.TrimSpace(string(content)), "/"), nil
}

func (v *Vite) FuncMap() template.FuncMap {
	return template.FuncMap{
		"vite": v.Tags,
	}
}

func (v *Vite) expandEntry(entry string) string {
	if !strings.HasPrefix(entry, "@") {
		return entry
	}
	rest := entry[1:]
	if sub, ok := strings.CutPrefix(rest, "/"); ok {
		return path.Join(resourcesDir, sub)
	}
	if !v.config.Modules {
		return entry
	}
	module, sub, ok := strings.Cut(rest, "/")
	if !ok || module == "" || sub == "" {
		return entry
	}
	return path.Join(v.config.ModulesDir, module, resourcesDir, sub)
}

func (v *Vite) devTags(entries []string) (template.HTML, error) {
	server, err := v.DevServerURL()
	if err != nil {
		return "", err
	}
	var b strings.Builder
	writeScript(&b, server+"/"+wsClient, v.jsAttrs)
	for _, entry := range entries {
		if entry == ReactRefreshEntry {
			b.WriteString(reactRefreshPreamble(server))
			continue
		}
		entry = v.expandEntry(entry)
		if isCSS.MatchString(entry) {
			writeLink(&b, devURL(server, entry), v.cssAttrs)
		} else {
			writeScript(&b, devURL(server, entry), v.jsAttrs)
		}
	}
	return template.HTML(b.String()), nil
}

func (v *Vite) buildTags(entries []string) (template.HTML, error) {
	manifest, err := v.manifest.load(v.manifestPath)
	if err != nil {
		return "", err
	}
	var b strings.Builder
	seenChunks := map[string]bool{}
	seenCSS := map[string]bool{}
	for _, entry := range entries {
		if entry == ReactRefreshEntry {
			continue
		}
		entry = strings.TrimLeft(v.expandEntry(entry), "/")
		chunk, ok := manifest[entry]
		if !ok {
			return "", fmt.Errorf("vite: %q is not in the manifest at %s — is it an entry in vite.config.js, and is the build current?", entry, v.manifestPath)
		}
		v.writeChunkCSS(&b, manifest, chunk, seenChunks, seenCSS)
		url := v.config.BuildURLPrefix + chunk.File
		if isCSS.MatchString(entry) || strings.HasSuffix(chunk.File, ".css") {
			writeLink(&b, url, v.cssAttrs)
		} else {
			writeScript(&b, url, v.jsAttrs)
		}
	}
	return template.HTML(b.String()), nil
}

func (v *Vite) writeChunkCSS(b *strings.Builder, manifest map[string]*chunk, c *chunk, seenChunks, seenCSS map[string]bool) {
	for _, imported := range c.Imports {
		if seenChunks[imported] {
			continue
		}
		seenChunks[imported] = true
		if importedChunk, ok := manifest[imported]; ok {
			v.writeChunkCSS(b, manifest, importedChunk, seenChunks, seenCSS)
		}
	}
	for _, css := range c.CSS {
		if seenCSS[css] {
			continue
		}
		seenCSS[css] = true
		writeLink(b, v.config.BuildURLPrefix+css, v.cssAttrs)
	}
}

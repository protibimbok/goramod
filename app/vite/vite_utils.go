package vite

import (
	"fmt"
	"html/template"
	"path"
	"sort"
	"strings"
)

func devURL(server, entry string) string {
	if strings.HasPrefix(entry, "../") {
		return server + "/@fs/" + path.Clean(entry)
	}
	return server + "/" + strings.TrimLeft(entry, "/")
}

func reactRefreshPreamble(server string) string {
	return `<script type="module">
import RefreshRuntime from "` + template.JSEscapeString(server) + `/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>`
}

func makeAttrs(attrs map[string]string) string {
	keys := make([]string, 0, len(attrs))
	for key := range attrs {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		val := attrs[key]
		if val == "" {
			parts = append(parts, template.HTMLEscapeString(key))
			continue
		}
		parts = append(parts, fmt.Sprintf(`%s="%s"`, template.HTMLEscapeString(key), template.HTMLEscapeString(val)))
	}
	return strings.Join(parts, " ")
}

func writeScript(b *strings.Builder, url, attrs string) {
	b.WriteString("<script")
	writeSpaced(b, attrs)
	b.WriteString(` src="`)
	b.WriteString(template.HTMLEscapeString(url))
	b.WriteString(`"></script>`)
	b.WriteByte('\n')
}

func writeLink(b *strings.Builder, url, attrs string) {
	b.WriteString("<link")
	writeSpaced(b, attrs)
	b.WriteString(` href="`)
	b.WriteString(template.HTMLEscapeString(url))
	b.WriteString(`" />`)
	b.WriteByte('\n')
}

func writeSpaced(b *strings.Builder, attrs string) {
	if attrs != "" {
		b.WriteByte(' ')
		b.WriteString(attrs)
	}
}

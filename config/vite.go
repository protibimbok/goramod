package config

import (
	"github.com/gin-gonic/gin/render"
	goravelgin "github.com/goravel/gin"

	"goravel/app/facades"
	"goravel/app/vite"
)

func init() {
	config := facades.Config()
	config.Add("vite", map[string]any{
		// Modular mode: entries and imports named "@<module>/<path>"
		// resolve to "modules/<module>/resources/<path>", mirroring the
		// aliases the npm plugin registers in vite.config.js.
		"modules": true,
	})

	// Register the `vite` template function with the gin HTML renderer:
	//
	//	{{ vite "@/app.tsx" "@/main.css" }}
	//
	// This sets a nested key inside the "http" config added by http.go, which
	// runs first because Go initializes a package's files in file-name order.
	config.Add("http.drivers.gin.template", func() (render.HTMLRender, error) {
		return goravelgin.NewTemplate(goravelgin.RenderOptions{
			FuncMap: vite.FuncMap(),
		})
	})
}

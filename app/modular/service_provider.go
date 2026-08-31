package modular

import (
	"fmt"
	"goravel/app/facades"
	"os"

	"github.com/goravel/framework/contracts/foundation"
	"github.com/goravel/framework/support/path"
)

type ModuleServiceProvider struct{}

func (m *ModuleServiceProvider) Register(app foundation.Application) {}

func (m *ModuleServiceProvider) Boot(app foundation.Application) {
	rootDir := path.Base()

	modulesBase := fmt.Sprintf("%s/modules", rootDir)

	files, err := os.ReadDir(modulesBase)
	if err != nil {
		fmt.Println(err)
		return
	}

	for _, file := range files {
		viewsDir := fmt.Sprintf("%s/%s/resources/views", modulesBase, file.Name())
		if _, err := os.Stat(viewsDir); os.IsNotExist(err) {
			continue
		}
		facades.View().LoadViewsFrom(viewsDir)
	}

	// HACK: no-arg GlobalMiddleware() re-runs Route.init(), which re-parses
	// templates now that ViewFacade is set and the extra view paths exist.
	if route := app.MakeRoute(); route != nil {
		route.GlobalMiddleware()
	}
}

package modular

import (
	"fmt"
	"reflect"

	"github.com/goravel/framework/support/color"
)

var providerTypes = []reflect.Type{
	reflect.TypeOf((*RouteProvider)(nil)).Elem(),
	reflect.TypeOf((*ApiRouteProvider)(nil)).Elem(),
	reflect.TypeOf((*GlobalMiddlewareProvider)(nil)).Elem(),
	reflect.TypeOf((*MigrationProvider)(nil)).Elem(),
	reflect.TypeOf((*SeederProvider)(nil)).Elem(),
	reflect.TypeOf((*CommandProvider)(nil)).Elem(),
}

func checkReceivers(m Module) {
	t := reflect.TypeOf(m)
	if t.Kind() != reflect.Pointer {
		panic(fmt.Sprintf(
			"module `%s` must be registered as poiner",
			m.Name(),
		))
	}

	color.Cyan().Printf("Registered providers for %s:\n", m.Name())

	for _, iface := range providerTypes {
		if t.Implements(iface) {
			color.Green().Printf(" [OK] %s\n", iface.Name())
		} else {
			color.Red().Printf(" [NO] %s\n", iface.Name())
		}
	}
}

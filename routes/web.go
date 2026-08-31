package routes

import (
	"goravel/app/facades"
	"goravel/app/modular"
)

func Web() {
	modular.Routes(facades.Route())
	facades.Route().Static("public", "./public")
}

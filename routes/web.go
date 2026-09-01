package routes

import (
	"goravel/app/facades"
	"goravel/app/modular"

	"github.com/goravel/framework/contracts/http"
)

func Web() {
	modular.Routes(facades.Route())
	facades.Route().Static("public", "./public")

	facades.Route().Fallback(func(ctx http.Context) http.Response {
		if res := ApiFallback(ctx); res != nil {
			return res
		}

		return ctx.Response().View().Make("react-shell.tmpl")
	})
}

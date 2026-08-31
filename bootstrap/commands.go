package bootstrap

import (
	"goravel/app/modular"

	"github.com/goravel/framework/contracts/console"
)

func Commands() []console.Command {
	return modular.Commands()
}

package modular

import "sort"

type Ordered interface {
	Order() int
}

func orderKey(orderable interface{}) (group, order int) {
	if ordered, ok := orderable.(Ordered); ok {
		order = ordered.Order()
	}

	if order < 0 {
		return 1, 0
	}
	return 0, order
}

func sortOrderable[T interface{}](orderables []T) []T {
	sorted := make([]T, len(orderables))
	copy(sorted, orderables)

	sort.SliceStable(sorted, func(i, j int) bool {
		iGroup, iOrder := orderKey(sorted[i])
		jGroup, jOrder := orderKey(sorted[j])
		return iGroup < jGroup || (iGroup == jGroup && iOrder < jOrder)
	})
	return sorted
}

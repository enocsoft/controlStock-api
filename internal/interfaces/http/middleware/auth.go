package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"github.com/tu-usuario/saas-comercios/pkg/jwt"
)

type contextKey string

const (
	usuarioIDKey contextKey = "usuario_id"
	rolKey       contextKey = "rol"
)

func Auth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				http.Error(w, `{"error":"falta el header Authorization"}`, http.StatusUnauthorized)
				return
			}
			tokenString := strings.TrimPrefix(header, "Bearer ")

			claims, err := jwt.Validar(tokenString, jwtSecret)
			if err != nil {
				http.Error(w, `{"error":"token inválido o expirado"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), usuarioIDKey, claims.UsuarioID)
			ctx = context.WithValue(ctx, rolKey, claims.Rol)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func UsuarioIDDesdeContexto(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(usuarioIDKey).(uuid.UUID)
	return id, ok
}

func RolDesdeContexto(ctx context.Context) (string, bool) {
	rol, ok := ctx.Value(rolKey).(string)
	return rol, ok
}

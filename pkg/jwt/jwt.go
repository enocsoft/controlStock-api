package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var ErrTokenInvalido = errors.New("token inválido o expirado")

type Claims struct {
	UsuarioID uuid.UUID `json:"usuario_id"`
	Rol       string    `json:"rol"`
	jwt.RegisteredClaims
}

func Generar(usuarioID uuid.UUID, rol string, secret string, ttl time.Duration) (string, error) {
	claims := Claims{
		UsuarioID: usuarioID,
		Rol:       rol,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func Validar(tokenString string, secret string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (any, error) {
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, ErrTokenInvalido
	}

	return claims, nil
}

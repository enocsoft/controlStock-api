package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/tu-usuario/saas-comercios/internal/domain"
	"github.com/tu-usuario/saas-comercios/internal/usecase/ports"
)

var _ ports.UsuarioRepository = (*UsuarioRepo)(nil)

type UsuarioRepo struct {
	db *pgxpool.Pool
}

func NewUsuarioRepo(db *pgxpool.Pool) *UsuarioRepo {
	return &UsuarioRepo{db: db}
}

func (r *UsuarioRepo) Save(ctx context.Context, u *domain.Usuario) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO usuarios (id, nombre, email, password_hash, rol, activo)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		u.ID, u.Nombre, u.Email, u.PasswordHash, u.Rol, u.Activo,
	)
	if err != nil {
		return fmt.Errorf("insertar usuario: %w", err)
	}
	return nil
}

func (r *UsuarioRepo) GetByEmail(ctx context.Context, email string) (*domain.Usuario, error) {
	var u domain.Usuario
	err := r.db.QueryRow(ctx,
		`SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = $1 AND activo = true`,
		email,
	).Scan(&u.ID, &u.Nombre, &u.Email, &u.PasswordHash, &u.Rol, &u.Activo)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrUsuarioNoEncontrado
		}
		return nil, fmt.Errorf("buscar usuario por email: %w", err)
	}

	return &u, nil
}

func (r *UsuarioRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Usuario, error) {
	var u domain.Usuario
	err := r.db.QueryRow(ctx,
		`SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE id = $1`,
		id,
	).Scan(&u.ID, &u.Nombre, &u.Email, &u.PasswordHash, &u.Rol, &u.Activo)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrUsuarioNoEncontrado
		}
		return nil, fmt.Errorf("buscar usuario por id: %w", err)
	}

	return &u, nil
}

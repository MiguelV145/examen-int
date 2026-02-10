# 📋 INTEGRACIÓN COMPLETA BACKEND - ASESORÍAS, DISPONIBILIDAD Y REPORTES

## 📊 Resumen de Implementación

Este documento describe la integración completa del frontend Angular con el backend Spring Boot para el módulo de asesorías, disponibilidad de programadores y dashboards de reportes.

---

## 📁 ARCHIVOS CREADOS / MODIFICADOS

### **MODELOS (core/models/)**
- ✅ `availability.models.ts` - Modelos de disponibilidad con DayOfWeek, Modality, AvailabilitySlot
- ✅ `asesorias.models.ts` - Modelos de asesorías con AsesoriaStatus, Asesoria, AsesoriaResponse
- ✅ `reports.models.ts` - Modelos de reportes y dashboards

### **API SERVICES (core/services/api/)**
- ✅ `availability.api.ts` - CRUD de slots de disponibilidad
- ✅ `asesorias.api.ts` - CRUD de asesorías, consultas por rol
- ✅ `reports.api.ts` - Reportes, dashboards y descargas PDF/XLSX

### **GUARDS (core/guards/)**
- ✅ `programador-guard.ts` (NUEVO) - Protege rutas solo para PROGRAMADOR
- ✅ `auth-guard.ts` - Ya existe, protege rutas autenticadas
- ✅ `admin-guard.ts` - Ya existe, protege rutas admin

### **COMPONENTES FEATURE (features/asesorias/)**
- ✅ `reservar-asesoria/` - Reservar asesoría (USER)
- ✅ `mis-asesorias/` - Historial de asesorías (USER)
- ✅ `disponibilidad-programador/` - CRUD de horarios (PROGRAMADOR)
- ✅ `asesorias-recibidas/` - Gestión de asesorías recibidas (PROGRAMADOR)

### **COMPONENTES ADMIN (features/admin/)**
- ✅ `reportes-dashboard/` - Dashboard completo con filtros y descargas

### **RUTAS (app.routes.ts)**
- ✅ Actualizado con todas las nuevas rutas y guards

---

## 🔒 SEGURIDAD POR ROLES

| Ruta | Rol Requerido | Guard |
|------|--------------|-------|
| `/asesorias` | USER | authGuard |
| `/mis-asesorias` | USER | authGuard |
| `/programador/disponibilidad` | PROGRAMADOR | programadorGuard |
| `/programador/asesorias` | PROGRAMADOR | programadorGuard |
| `/admin/reportes` | ADMIN | adminGuard |

---

## 📌 ENDPOINTS BACKEND ESPERADOS

### **Disponibilidad**
```
GET    /api/availability/me                          - Mis slots
GET    /api/availability/programmer/:id              - Slots de programador
POST   /api/availability                             - Crear slot
PUT    /api/availability/:id                         - Actualizar slot
DELETE /api/availability/:id                         - Eliminar slot
```

### **Asesorías**
```
POST   /api/asesorias                                - Reservar
GET    /api/asesorias/mis-asesorias                  - Mis asesorías
GET    /api/asesorias/recibidas                      - Asesorías recibidas (programador)
GET    /api/asesorias/:id                            - Detalle
PUT    /api/asesorias/:id/status                     - Actualizar estado
DELETE /api/asesorias/:id                            - Cancelar
GET    /api/asesorias/programmers                    - Listar programadores
```

### **Reportes**
```
GET    /api/reports/asesorias-summary                - Resumen por estado
GET    /api/reports/asesorias-by-programmer          - Agrupado por programador
GET    /api/reports/asesorias-by-date                - Agrupado por fecha
GET    /api/reports/projects-by-user                 - Proyectos por usuario
GET    /api/reports/dashboard                        - Dashboard completo
GET    /api/reports/download/asesorias-pdf           - Descargar PDF
GET    /api/reports/download/asesorias-xlsx          - Descargar XLSX
GET    /api/reports/download/projects-pdf            - Descargar PDF
GET    /api/reports/download/projects-xlsx           - Descargar XLSX
```

---

## 🚀 CÓMO USAR

### **1. Configurar Environment**
Verificar que `src/environments/environment.ts` tenga:
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://exam-final-2wr6.onrender.com'
};
```

### **2. Inyectar Services en Componentes**
```typescript
import { AsesoriasApiService } from '../../../core/services/api/asesorias.api';

constructor(
  private asesoriasApi = inject(AsesoriasApiService)
) {}

// Usar:
this.asesoriasApi.createAsesoria(dto).subscribe(...)
```

### **3. Usar Guards en Rutas**
```typescript
{
  path: 'programador/disponibilidad',
  loadComponent: ...,
  canActivate: [programadorGuard]
}
```

### **4. Descargar Reportes**
```typescript
this.reportsApi.downloadAsesoriasPdf(filters).subscribe(blob => {
  this.reportsApi.downloadFile(blob, 'asesorias.pdf');
});
```

---

## 🧪 DESARROLLO LOCAL

```bash
# Instalar dependencias
pnpm install

# Iniciar dev server
pnpm exec ng serve

# Navegar a
http://localhost:4200
```

---

## 📦 BUILD PRODUCCIÓN

```bash
# Build para GitHub Pages
pnpm exec ng build -c production --base-href /examen-int/

# Deploy
pnpm exec angular-cli-ghpages --dir=dist/examen-int/browser --repo=https://github.com/MiguelV145/examen-int.git
```

---

## 🔄 FLUJOS DE USUARIO

### **USER - Reservar Asesoría**
1. Navega a `/asesorias`
2. Selecciona programador
3. Elige modalidad (PRESENCIAL, VIRTUAL, HIBRIDA)
4. Selecciona slot disponible
5. Completa tema y notas
6. Confirma → API crea asesoría en estado PENDIENTE
7. Navega a `/mis-asesorias` para ver historial

### **PROGRAMADOR - Gestionar Horarios**
1. Navega a `/programador/disponibilidad`
2. Crea slots de disponibilidad (día, hora inicio/fin, modalidad)
3. Puede desactivar/reactivar/eliminar slots

### **PROGRAMADOR - Gestionar Asesorías Recibidas**
1. Navega a `/programador/asesorias`
2. Ve asesorías pendientes
3. Puede CONFIRMAR (→ CONFIRMADA), RECHAZAR (→ RECHAZADA)
4. Si confirmada, puede INICIAR (→ EN_CURSO)
5. Si en curso, puede MARCAR COMPLETADA (→ COMPLETADA)

### **ADMIN - Ver Reportes**
1. Navega a `/admin/reportes`
2. Aplica filtros (fechas, estado, programador)
3. Ve dashboard con:
   - Total de asesorías, programadores, usuarios
   - Tablas de datos
   - Gráficos resumen
4. Descarga reportes en PDF o XLSX

---

## 🎨 UI/UX

### **Componentes DaisyUI Usados:**
- `card` - Tarjetas de contenido
- `badge` - Estados de asesorías
- `btn` - Botones
- `select` - Dropdowns
- `input` / `textarea` - Formularios
- `table` - Tablas de datos
- `alert` - Mensajes informativos
- `loading` - Spinners

### **Estilos Tailwind:**
- Grid responsive (1-2-3 columnas)
- Colores coherentes (primary, success, warning, error, info)
- Sombras y espaciado consistente

---

## 🔐 SEGURIDAD

✅ **Token JWT**: El `auth-token.interceptor.ts` agrega automáticamente `Authorization: Bearer <token>`

✅ **Guards**: Protegen rutas por rol (USER, PROGRAMADOR, ADMIN)

✅ **Errores 401**: Redirigen a login si el token expira

✅ **Sin Credenciales**: No usa `withCredentials` (token en header)

---

## 📝 NOTIFICACIONES

Usa `ToastrService` (ngx-toastr):
```typescript
this.toastr.success('Asesoría reservada correctamente');
this.toastr.error('Error al cargar disponibilidad');
this.toastr.info('Actualizando estado...');
```

---

## 🐛 TROUBLESHOOTING

### **Error 400 en login**
- Revisar que el email/identifier se envíe correctamente
- Verificar que `auth-api.service.ts` convierte `identifier → email`

### **Error 401 Unauthorized**
- Token expirado → Redirige a login
- Verificar que el backend está activo y devuelve token válido

### **Error 403 Forbidden**
- Usuario no tiene el rol requerido
- Verificar roles en el token JWT

### **No carga disponibilidad**
- Revisar que el programador tiene slots creados
- Filtrar por modalidad corrrecta

### **Descarga de reportes falla**
- Usar `responseType: 'blob'` en HTTP GET
- Verificar que el backend devuelve el archivo correctamente

---

## 📞 SOPORTE

Para problemas o preguntas:
1. Revisar console del navegador (F12)
2. Consultar backend logs
3. Verificar que los endpoints coinciden exactamente
4. Revisar estructura de DTOs enviados/recibidos

---

**Fecha creación:** 2026-02-10
**Versión:** 1.0.0
**Estado:** ✅ Production-Ready

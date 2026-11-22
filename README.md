# Prometheus Educational Suite (React + TypeScript) 🔥

Esta es la nueva versión moderna de **Prometheus**, migrada a **React 19 + TypeScript + Vite + Tailwind CSS**, manteniendo el **100% de las funcionalidades**, funcionamiento **100% offline**, persistencia en IndexedDB (Dexie.js) y compatibilidad total con los respaldos `.json` previos.

---

## 🚀 Aplicaciones Integradas en la Suite

1. **Calendario y Planificador Anual** (`/`):
   - Vistas: Mes, Semana y Agenda.
   - Creación y edición de clases con evaluaciones formativas/sumativas.
   - Reglas de repetición y recurrencia (diaria, semanal, mensual con límite de repeticiones o fechas).
   - Tipos de día: Feriados, Eventos del Colegio, Jornadas Docentes (In-Service), Salida Temprana y notas de recordatorio.
   - Pila de Deshacer / Rehacer con atajos de teclado `Ctrl + Z` y `Ctrl + Y`.
   - Asignaturas con colores personalizables y filtro de visibilidad.
   - Copiar o mover eventos entre Años Escolares respetando días lectivos.
2. **Horario Semanal** (`/timetable`):
   - Grilla interactiva semanal (Lunes a Viernes).
   - Bloques lectivos y no lectivos (Recreos, Almuerzo, Planificación, Clases especiales).
   - Asistente de resolución de conflictos: *Reemplazar*, *Empujar en cascada*, *Intercambiar* o *Calzar*.
   - Modo de impresión optimizado.
3. **Planificador de Lecciones** (`/lesson-planner`):
   - Estructura jerárquica en árbol: *Curso > Asignatura > Unidad / Capítulo > Lección*.
   - Búsqueda instantánea de lecciones en tiempo real.
   - Momentos pedagógicos estructurados: Objetivos, Lecturas, Inicio (Warm-up), Presentación, Práctica guiada, Práctica independiente, Cierre y Adecuaciones curriculares (DUA).
   - Exportación multi-formato: **Word (.docx)**, **PDF** y **Texto plano (.txt)**.
   - Gestión de plantillas reutilizables.
4. **Libro de Clases** (`/gradebook`):
   - Matriz de calificaciones por curso y asignatura.
   - Categorías con ponderación porcentual (ej: Exámenes 50%, Tareas 30%, Participación 20%) con cálculo automático de promedios ponderados.
   - Registro diario de asistencia (*Presente, Ausente, Atraso, Justificado*).
   - Bitácora de observaciones y recordatorios por alumno.
   - Carga masiva e importación de estudiantes mediante archivos **CSV** (PapaParse).
5. **Corrector de Pruebas / EscalaPro** (`/proof-correction`):
   - Calculadora de escalas paramétricas: Sistema chileno (1.0 - 7.0 con 60% de exigencia), Decimal (0.0 - 10.0), Letras U.S. (A-F) y GPA (0.0 - 4.0).
   - Calculadora aritmética auxiliar en pantalla.
   - Tabla punto a punto con estado de aprobación e impresión directa.

---

## 🛠️ Comandos de Desarrollo

En la carpeta `prometheus-app/`:

```powershell
# 1. Iniciar servidor de desarrollo local
npm run dev

# 2. Compilar para producción (genera carpeta dist/ estática)
npm run build

# 3. Ejecutar la suite de pruebas unitarias
npm test

# 4. Previsualizar la compilación de producción
npm run preview
```

---

## 🗄️ Persistencia y Copias de Seguridad

- Todos los datos se guardan de forma local en el navegador del usuario utilizando **IndexedDB** a través de **Dexie.js**, con respaldo en `localStorage`.
- Los datos de la versión anterior en `localforage` se detectan y migran automáticamente en el primer inicio.
- Desde el icono de disco duro (arriba a la derecha) puedes:
  - **Exportar a JSON**: Descarga un archivo completo de copia de seguridad.
  - **Importar JSON**: Restaura cualquier respaldo `.json` existente (incluyendo los de la carpeta `Prometheus-mvp/Saved Data/`).


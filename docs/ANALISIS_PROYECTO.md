# Análisis del Proyecto: Sistema PasaYa

## 1. Descripción de la problemática

En muchas ciudades del Perú, el pasaje del transporte público todavía se paga en efectivo. A diferencia de otros países, aquí el pasajero suele subir a la unidad de transporte sin pagar y recién realiza el pago al momento de bajar: debe acercarse a la puerta, entregar las monedas al cobrador o al conductor y esperar su vuelto antes de descender. Este proceso se repite cientos de veces al día en cada unidad operativa.

Este modo de pago genera una serie de dificultades críticas en la operación diaria:
- **Congestión y demoras en el descenso:** Cuando la unidad va llena, el pasajero no puede llegar a la puerta ni alcanzar al cobrador para pagar, por lo que no logra bajar en su paradero, se pasa de su destino o retrasa a toda la unidad mientras se abre paso y espera su vuelto.
- **Fricciones operativas:** Falta recurrente de sencillo/monedas para dar vuelto, discusiones continuas por el monto del pasaje y por la aplicación del medio pasaje (escolar y universitario).
- **Riesgo de inseguridad:** Exposición constante a robos y asaltos tanto para el cobrador como para el conductor al acumular dinero en efectivo a bordo de la unidad.
- **Falta de control y trazabilidad:** Las empresas de transporte no tienen información confiable ni exacta sobre cuántos pasajeros se transportaron ni cuánto dinero se recaudó realmente en cada unidad, ruta y jornada, dependiendo de liquidaciones manuales e informales al cierre del día.

Como referencia, en países como Japón y Corea del Sur la mayoría de pasajeros utiliza tarjetas recargables inteligentes que se aproximan a un lector al momento de abordar. Tomando esta solución como base, el proyecto busca sustituir el pago tradicional en efectivo por un sistema de pago electrónico con tarjeta prepago recargable adaptado a nuestro entorno.

---

## 2. Objetivo de la solución

Desarrollar la aplicación **PasaYa**, una solución de software orientada a administrar todo el ciclo del pago electrónico del pasaje en el transporte público urbano.

### Objetivos clave:
- **Trasladar el cobro al momento de subir:** Permitir que el pasajero acerque su tarjeta al abordar, registrando el viaje (asociando tarjeta, unidad y ruta) y descontando automáticamente la tarifa correspondiente (general o estudiante). De este modo, al llegar a su paradero el usuario solo desciende sin interrupciones.
- **Eliminar el manejo de efectivo dentro de la unidad:** Agilizar los tiempos en cada paradero, suprimir discusiones por cambio y mitigar los riesgos delictivos por tenencia de efectivo.
- **Transparentar la recaudación y liquidación:** Calcular con precisión la recaudación de cada unidad para generar liquidaciones ordenadas y oportunas en favor de las empresas de transporte.
- **Salvaguardar el saldo del usuario:** Proveer mecanismos para bloquear tarjetas extraviadas o robadas y reponerlas transfiriendo íntegramente el saldo acumulado.
- **Acotamiento del alcance (Vibe Coding):** El alcance del proyecto se enfoca en el software de gestión y transaccionalidad web con base de datos relacional. El abordaje y validación de tarjetas se simulará mediante un formulario web, prescindiendo deliberadamente de integración con hardware físico especializado o pasarelas bancarias externas complejas.

---

## 3. Actores involucrados

Con base en la información original de la Etapa 1 y el análisis de responsabilidades operativas, se identifican los siguientes actores:

### 3.1. Pasajero (General y Estudiante)
- **Responsabilidad principal:** Adquirir su tarjeta personalizada prepago, gestionar sus recargas de saldo en los puntos autorizados y validar su tarjeta al abordar la unidad.
- **Responsabilidades secundarias:** Solicitar el bloqueo y reposición de tarjeta en caso de pérdida o sustracción para proteger su saldo; acreditar su condición de estudiante para acceder a la tarifa diferenciada.

### 3.2. Operador de Punto de Recarga (Cajero / Agente)
- **Responsabilidad principal:** Recibir los fondos de los pasajeros y registrar la transacción de recarga en el sistema, acreditando de inmediato el saldo a la tarjeta.
- **Responsabilidades secundarias:** Atender solicitudes de emisión inicial y reposición de plásticos siguiendo las validaciones del sistema.

### 3.3. Conductor / Cobrador (Personal de la Unidad)
- **Responsabilidad principal:** Verificar y supervisar que cada pasajero que sube a la unidad registre y valide su tarjeta antes de ingresar al salón del bus.
- **Responsabilidades secundarias:** Operar la unidad asignada cumpliendo con el itinerario de la ruta establecida.

### 3.4. Empresa de Transporte (Operador Concesionario)
- **Responsabilidad principal:** Proporcionar los datos de su flota de buses (placa, capacidad técnica, conductor asignado) para su correcta vinculación operativa.
- **Responsabilidades secundarias:** Consultar los reportes de viajes y montos recaudados por unidad, ruta y fecha, y recibir la liquidación económica periódica correspondiente.

### 3.5. Administrador del Sistema (PasaYa)
- **Responsabilidad principal:** Configurar y mantener los parámetros del sistema (rutas, paraderos principales, tarifas general y preferencial), registrar empresas, unidades y coordinar la emisión de tarjetas.
- **Responsabilidades secundarias:** Supervisar el flujo transaccional global, procesar las liquidaciones a las empresas de transporte y atender incidencias administrativas.

---

## 4. Procesos identificados

En la primera etapa se definieron ocho (8) procesos que estructuran la solución:

| N.º | Proceso | Descripción Original |
| :---: | :--- | :--- |
| **1** | **Registro de pasajeros y emisión de tarjetas** | Registra los datos del pasajero, su tipo de tarifa y le asigna una tarjeta con código único. |
| **2** | **Recarga de saldo** | Registra cada recarga, el monto, el punto de recarga y actualiza el saldo de la tarjeta. |
| **3** | **Registro de empresas y unidades** | Registra las empresas de transporte y sus buses (placa, capacidad, conductor asignado). |
| **4** | **Registro de rutas y tarifas** | Define las rutas, sus paraderos principales y la tarifa general y de estudiante. |
| **5** | **Registro de viajes (cobro al abordar)** | Registra el pago al subir (ya no al bajar) y descuenta la tarifa del saldo; rechaza el cobro si no hay saldo suficiente. |
| **6** | **Control de recaudación** | Consolida lo cobrado por unidad, ruta y día, y lo compara con la cantidad de viajes. |
| **7** | **Bloqueo y reposición de tarjetas** | Bloquea una tarjeta perdida o robada y transfiere su saldo a una nueva tarjeta. |
| **8** | **Liquidación a empresas** | Calcula y registra el pago que corresponde a cada empresa según su recaudación del período. |

### Relación y flujo operativo entre procesos:
El pasajero tramita su tarjeta (**Proceso 1**), le abona saldo en un punto autorizado (**Proceso 2**) y la presenta al realizar un viaje (**Proceso 5**) dentro de una unidad habilitada (**Proceso 3**) que cubre una ruta y tarifa predefinidas (**Proceso 4**). El cúmulo de viajes genera la recaudación total (**Proceso 6**), a partir de la cual se calcula y ejecuta la liquidación para la empresa concesionaria (**Proceso 8**). Si la tarjeta se extravía o es robada, el proceso de contingencia (**Proceso 7**) asegura que no se pierdan los fondos del usuario.

---

## 5. Observaciones y oportunidades de mejora

> [!NOTE]
> Esta sección contiene el análisis crítico elaborado por el **analista de requerimientos (IA)** para fortalecer el diseño funcional del sistema, diferenciando las sugerencias de la información original aprobada.

### 5.1. Coherencia de los procesos frente a la problemática
- **Coherencia sobresaliente:** La solución ataca con precisión los cuellos de botella expuestos:
  - El **Proceso 5** erradica el atasco en la puerta de salida al convertir el pago en un acto previo y fluido durante el abordaje.
  - Los **Procesos 1, 2 y 4** resuelven la conflictividad por el medio pasaje y la falta de sencillo, al automatizar el descuento según el perfil del usuario.
  - Los **Procesos 6 y 8** dotan a las empresas y administradores de auditoría y trazabilidad financiera total, terminando con la opacidad del efectivo.

### 5.2. Evaluación de transaccionalidad real
Al evaluar si los ocho procesos representan operaciones transaccionales genuinas (con afectación directa de estados y balances bajo criterios ACID), se distingue la siguiente tipología:
- **Transacciones Operativas Críticas (Afectación de Saldos y Estados):**
  - **Proceso 2 (Recarga de saldo):** Transacción financiera que incrementa el saldo y emite un comprobante/asiento de ingreso.
  - **Proceso 5 (Registro de viajes / Cobro al abordar):** Transacción de alta concurrencia que verifica fondos en tiempo real, descuenta saldo de la tarjeta y genera un evento inmutable de viaje.
  - **Proceso 7 (Bloqueo y reposición):** Transacción atómica compuesta: anulación de plástico fuente, creación/asignación de plástico destino y migración íntegra del saldo remanente.
  - **Proceso 8 (Liquidación a empresas):** Transacción financiera de cierre que calcula totales devengados, genera la orden de pago y marca los viajes correspondientes como "liquidados".
- **Transacciones Maestras / Mantenimiento de Catálogos (CRUD):**
  - **Proceso 1 (Pasajeros y tarjetas), Proceso 3 (Empresas y unidades) y Proceso 4 (Rutas y tarifas):** Son procesos de aprovisionamiento de datos maestros, indispensables para alimentar la lógica de negocio pero de menor frecuencia transaccional.
- **Proceso Analítico y de Cuadre:**
  - **Proceso 6 (Control de recaudación):** En su formulación original actúa como una vista/reporte consolidado. *Propuesta IA:* Para que adquiera valor transaccional, debe concebirse como un "Cierre y cuadre diario de unidad/ruta", permitiendo a la administración formalizar el saldo del día previo a la liquidación.

### 5.3. Funcionalidades faltantes sugeridas (Propuestas IA)
1. **Gestión de incidencias y averías mecánicas (Transbordo / Devolución):** Al cobrar al inicio, si una unidad sufre un percance mecánico en ruta, los pasajeros quedan perjudicados. Se sugiere un mecanismo de trasbordo hacia otra unidad de la misma ruta/empresa sin costo adicional o la reversión del viaje.
2. **Reverso o anulación de recarga por error de digitación:** En el Proceso 2, si un cajero comete una equivocación en el importe ingresado (ej. ingresa S/ 100 en vez de S/ 10), debe existir una ventana de tiempo corta y controlada para revertir la recarga con registro de auditoría.
3. **Mecanismo de inspección o fiscalización a bordo:** Al no existir un boleto físico de papel, el sistema debería ofrecer un medio de consulta rápida (o reporte de abordaje de la unidad en tiempo real) que permita verificar si un pasajero a bordo realmente pasó su tarjeta.

### 5.4. Aspectos que requieren mayor definición
- **Naturaleza de la tarjeta en la simulación:** Dado que no se usará hardware NFC/RFID, se debe precisar si la simulación del abordaje se realizará ingresando el código único de tarjeta, seleccionando el pasajero de una lista desplegable o mediante lectura de un código QR simulado.
- **Estructura tarifaria:** Se debe confirmar si las tarifas de las rutas son siempre planas (únicas de inicio a fin) o si en el futuro podrían incluir variación por etapas/paraderos.

---

## 6. Preguntas pendientes por resolver

A fin de avanzar con paso firme a la siguiente fase de requisitos (historias de usuario y casos de uso), se formulan las siguientes preguntas clave para decisión del equipo de trabajo:

1. **Esquema de tarifa por ruta:**
   - ¿La tarifa será estrictamente **plana** para toda la ruta (un solo monto fijo al subir, sin importar dónde descienda el usuario)?
   *(Recomendación IA: Sí, mantener tarifa plana para garantizar agilidad y no requerir validación al descender).*

2. **Gestión de contingencias por avería del bus:**
   - Si una unidad se malogra a mitad de camino tras haber cobrado al abordar, ¿el sistema debe soportar una función de **trasbordo** a otra unidad o se asumirá resuelto fuera del sistema en esta primera versión?

3. **Vigencia del medio pasaje:**
   - Para la tarifa de estudiante, ¿se debe registrar una **fecha de vencimiento** del carné, tras la cual el sistema vuelva a aplicar automáticamente la tarifa general?

4. **Operación de los puntos de recarga:**
   - Las recargas en puntos autorizados, ¿se manejan como operaciones de un cajero interno con apertura/cierre de turno, o simplemente como un registro directo de saldo sin control de caja?

5. **Interacción del cobrador a bordo en la simulación web:**
   - En la simulación del abordaje (**Proceso 5**), ¿quién interactúa con el formulario: el propio pasajero (autoservicio) o el conductor/cobrador desde una interfaz de cabina?

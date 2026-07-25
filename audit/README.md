# Auditoría de servidores locales (Ubuntu + CasaOS)

Punto de partida para auditar los dos servidores Ubuntu/CasaOS (y la Raspberry Pi
que hospeda este proyecto), revisar el estado de los backups y dejarlos bien
configurados.

## 1. Cómo puedo acceder (y cómo no)

Trabajo desde un contenedor aislado en la nube. **No tengo ruta de red hacia tu
LAN**: no puedo hacer SSH a `192.168.x.x` ni a `casaos.local`. Tampoco puedo
guardar credenciales entre sesiones (el contenedor se destruye al terminar).

Opciones reales, de la que recomiendo a la que menos:

| Opción | Cómo funciona | Valoración |
|---|---|---|
| **A. Recolector + informe** (recomendada) | Ejecutas `collect-audit.sh` en cada servidor y me pasas el `.txt` que genera (pegado aquí o commiteado en una rama). Yo audito y te devuelvo diagnóstico + scripts de configuración que tú aplicas. | Sin exponer nada a Internet, sin credenciales compartidas, tú controlas cada cambio. Coste: un copiar/pegar por ronda. |
| **B. Claude Code local** | Instalas Claude Code en tu portátil (o en el propio servidor) y me lanzas desde ahí. Tengo shell directa por SSH en tu LAN. | Iteración inmediata, sin copiar/pegar. Es la vía natural para la fase de *configurar*. |
| **C. Túnel a este contenedor** | Meter este contenedor en tu tailnet o exponer SSH. | No la recomiendo: exige darme una clave de acceso a tu red y el contenedor es efímero. |

Sugerencia práctica: **auditamos con la A** (rápido, seguro, y el informe queda
como documentación) y **configuramos con la B** si quieres que ejecute yo los cambios.

## 2. Ejecutar el recolector

En cada servidor:

```bash
# Descárgalo del repo o cópialo por scp
curl -fsSLO https://raw.githubusercontent.com/luisrioja/3DRiojaRemake/claude/local-servers-audit-kn1k35/audit/collect-audit.sh

sudo bash collect-audit.sh
# -> genera ./audit-<host>-<fecha>.txt
```

Tarda 1–3 minutos. Recomendable instalar antes `smartmontools` para que incluya
la salud de los discos (`sudo apt install -y smartmontools`); si no está, el
resto del informe sale igual.

### Qué recoge

Sistema y hardware · almacenamiento (particiones, LVM/RAID/ZFS/btrfs, SMART,
consumo por carpeta) · CasaOS (versión, config, `/DATA`, apps) · Docker
(contenedores, volúmenes, puertos, montajes, políticas de reinicio) ·
**backups** (herramientas instaladas, configuraciones, snapshots, cron/timers,
logs) · red y puertos a la escucha · seguridad (SSH, firewall, fail2ban,
usuarios, sudo, actualizaciones pendientes) · salud (errores de journal/dmesg,
temperaturas, monitorización).

### Qué NO recoge

Es **solo lectura**: no instala, no modifica, no borra nada. No copia el
contenido de tus ficheros `.env`, claves privadas ni bases de datos. Los valores
de variables de entorno de los contenedores salen **enmascarados** (se ven los
nombres, no los valores), igual que contraseñas, tokens y claves privadas que
aparezcan en cualquier salida.

Aun así, **revisa el informe antes de compartirlo**:

```bash
less audit-<host>-<fecha>.txt
grep -inE 'pass|secret|token|key' audit-<host>-<fecha>.txt
```

Y no me pegues nunca contraseñas, claves privadas ni tokens: si necesito que
exista un secreto, te digo dónde ponerlo y lo pones tú.

## 3. Lo que necesito que me cuentes

El informe da el "qué hay"; esto da el "qué quieres". Responde en texto, sin
formalidades:

**Inventario**
1. Los dos servidores: nombre, hardware (mini-PC, NAS, Pi), discos y si hay
   redundancia (RAID/ZFS) o disco único.
2. ¿Qué apps de CasaOS son las importantes? (Nextcloud, Immich, Jellyfin, Home
   Assistant, Paperless, bases de datos…)
3. Si hay NAS, disco USB externo, otro equipo o cuenta en la nube (Backblaze B2,
   Google Drive, OneDrive, S3, Hetzner Storage Box…) que se pueda usar como
   destino de backup — y espacio disponible en cada uno.
4. ¿Uno de los servidores es la Raspberry Pi de `/home/pi/3DRiojaRemake` que
   commitea semanalmente a GitHub, o es una tercera máquina?

**Expectativas de recuperación**
5. Si mañana muere un disco, ¿cuántos datos aceptas perder? ¿1 hora, 1 día, 1
   semana? (esto fija la frecuencia)
6. ¿Cuánto puedes estar sin el servicio? ¿Horas, un fin de semana? (esto fija si
   basta con copias de ficheros o hace falta imagen del sistema completo)
7. ¿Qué datos son irreemplazables (fotos, documentos, facturas) y qué es
   recreable (películas, cachés, imágenes de contenedores)?

**Contexto**
8. ¿Hay algo publicado a Internet (puertos abiertos en el router, Cloudflare
   Tunnel, Tailscale) o todo es LAN?
9. ¿Tienes ya algún backup que creas que funciona? Si sí, ¿has restaurado
   alguna vez desde él?
10. ¿Presupuesto para almacenamiento externo/nube, o solo hardware que ya tienes?

## 4. Plan de trabajo

1. **Inventario** — ejecutas el recolector en los dos servidores (+ la Pi).
2. **Diagnóstico** — informe de hallazgos priorizado por riesgo: qué datos están
   hoy sin ninguna copia, qué copias existen pero no se verifican, y los
   agujeros de seguridad y fiabilidad que aparezcan de paso.
3. **Diseño de la estrategia de backup** — regla 3-2-1 aplicada a tu caso:
   qué se respalda, con qué herramienta, a qué destinos, con qué frecuencia y
   retención, y qué se excluye a propósito.
4. **Implementación** — scripts y unidades systemd concretas, con cifrado en los
   destinos que no controlas, parada/volcado consistente de bases de datos antes
   de copiar, y notificación cuando un backup falle.
5. **Prueba de restauración** — un backup no existe hasta que se ha restaurado.
   Ensayo documentado de recuperar un fichero, una app completa y el escenario
   "el disco murió".
6. **Endurecimiento** (opcional, después) — actualizaciones automáticas,
   firewall, SSH, exposición de contenedores, monitorización de discos.

---

Cuando tengas los dos informes, pégalos aquí (o `git add audit/informes/` en
esta rama) y arranco con el diagnóstico.

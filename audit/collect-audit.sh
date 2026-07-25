#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# collect-audit.sh — Recolector de inventario para auditoría de servidores
#                    Ubuntu + CasaOS (y Raspberry Pi OS).
#
# SOLO LECTURA: no instala, no borra, no modifica nada del sistema.
# Genera un fichero de texto con el estado del servidor para revisarlo.
#
# Uso:
#   sudo bash collect-audit.sh                 # informe en ./audit-<host>-<fecha>.txt
#   sudo bash collect-audit.sh -o /tmp/x.txt   # ruta de salida concreta
#   sudo bash collect-audit.sh --no-redact     # desactiva el enmascarado (NO recomendado)
#
# Los valores que parecen credenciales se enmascaran automáticamente antes de
# guardar. Revisa el fichero antes de compartirlo.
# ---------------------------------------------------------------------------
set -uo pipefail

VERSION="1.0"
REDACT=1
OUT=""
DOCKER_OK=0

while [ $# -gt 0 ]; do
  case "$1" in
    -o|--output) OUT="${2:-}"; shift 2 ;;
    --no-redact) REDACT=0; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; exit 1 ;;
  esac
done

HOST="$(hostname -s 2>/dev/null || echo desconocido)"
[ -n "$OUT" ] || OUT="$(pwd)/audit-${HOST}-$(date +%Y%m%d-%H%M).txt"
: >"$OUT" || { echo "No puedo escribir en $OUT" >&2; exit 1; }

# --- helpers ---------------------------------------------------------------
have() { command -v "$1" >/dev/null 2>&1; }
sec()  { printf '\n\n═══════════════════ %s ═══════════════════\n' "$*" >>"$OUT"; }
sub()  { printf '\n--- %s\n' "$*" >>"$OUT"; }

# q "comando shell"  -> ejecuta y volca stdout+stderr, con timeout
q() {
  sub "\$ $1"
  timeout 90 bash -c "$1" >>"$OUT" 2>&1
  local rc=$?
  [ $rc -eq 0 ] || printf '[código de salida: %s]\n' "$rc" >>"$OUT"
  return 0
}

# qi "binario" "comando"  -> solo si el binario existe
qi() {
  if have "$1"; then q "$2"; else printf '\n--- %s: no instalado\n' "$1" >>"$OUT"; fi
}

exists_note() {  # exists_note ruta
  if [ -e "$1" ]; then printf 'PRESENTE  %s\n' "$1" >>"$OUT"
  else printf 'ausente   %s\n' "$1" >>"$OUT"; fi
}

# --- arranque --------------------------------------------------------------
if [ "$(id -u)" -ne 0 ]; then
  echo "AVISO: no estás como root. Muchas secciones saldrán incompletas."
  echo "       Relanza con: sudo bash $0"
  echo
fi

echo "Recolectando... (puede tardar 1-3 minutos)"

{
  echo "INFORME DE AUDITORÍA — collect-audit.sh v$VERSION"
  echo "Host        : $(hostname -f 2>/dev/null || hostname)"
  echo "Fecha       : $(date -Is)"
  echo "Ejecutado por: $(id -un) (uid $(id -u))"
  echo "Enmascarado : $([ "$REDACT" -eq 1 ] && echo activado || echo DESACTIVADO)"
} >>"$OUT"

# ===========================================================================
sec "1. SISTEMA"
q  "cat /etc/os-release"
q  "uname -a"
q  "uptime"
q  "cat /proc/device-tree/model 2>/dev/null || true"
q  "cat /sys/devices/virtual/dmi/id/product_name /sys/devices/virtual/dmi/id/sys_vendor 2>/dev/null || true"
qi systemd-detect-virt "systemd-detect-virt || true"
q  "lscpu | head -25"
q  "free -h"
q  "swapon --show"
q  "timedatectl 2>/dev/null || true"
q  "cat /etc/hostname; hostnamectl 2>/dev/null || true"

sec "2. ALMACENAMIENTO Y SISTEMAS DE FICHEROS"
q  "lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT,MODEL,ROTA,TRAN"
q  "df -hT -x tmpfs -x devtmpfs"
q  "df -i -x tmpfs -x devtmpfs"
q  "cat /etc/fstab"
q  "findmnt -t nfs,nfs4,cifs,smb3,sshfs 2>/dev/null || echo 'sin montajes de red'"
qi blkid "blkid"
qi lvs "pvs; vgs; lvs"
q  "cat /proc/mdstat 2>/dev/null || echo 'sin RAID software (md)'"
qi mdadm "mdadm --detail --scan"
qi zpool "zpool status; zpool list; zfs list -t all"
qi btrfs "btrfs filesystem show; btrfs subvolume list / 2>/dev/null"

sub "Salud de discos (SMART)"
if have smartctl; then
  for d in /dev/sd? /dev/nvme?n1 /dev/mmcblk?; do
    [ -e "$d" ] || continue
    printf '\n>>> %s\n' "$d" >>"$OUT"
    timeout 30 smartctl -H -A -i "$d" 2>&1 | \
      grep -Ei 'Model|Serial|Capacity|SMART overall|Power_On_Hours|Reallocated|Pending|Wear|Percentage Used|Data Units Written|Temperature|Media_Wearout' >>"$OUT"
  done
else
  echo "[smartmontools no instalado: no puedo comprobar salud de discos]" >>"$OUT"
fi

sub "Consumo de espacio en rutas típicas de datos"
for p in /DATA /DATA/AppData /var/lib/docker /var/lib/casaos /home /srv /mnt /opt /var/log; do
  [ -d "$p" ] || continue
  printf '\n>>> %s\n' "$p" >>"$OUT"
  timeout 120 du -x -h --max-depth=1 "$p" 2>/dev/null | sort -h | tail -25 >>"$OUT"
done

# ===========================================================================
sec "3. CASAOS"
for f in /etc/casaos /etc/casaos.conf /var/lib/casaos /usr/lib/systemd/system/casaos.service; do exists_note "$f"; done
qi casaos "casaos -v 2>&1 | head -3"
q  "systemctl list-units --all --no-pager | grep -i casa || echo 'sin unidades casaos'"
q  "ls -la /etc/casaos 2>/dev/null; for f in /etc/casaos/*.conf; do echo \"### \$f\"; cat \"\$f\"; done 2>/dev/null"
q  "ls -la /var/lib/casaos 2>/dev/null | head -40"
q  "find /var/lib/casaos /etc/casaos -name '*.json' -o -name '*.db' 2>/dev/null | head -40"
q  "ls -la /DATA 2>/dev/null; ls -la /DATA/AppData 2>/dev/null | head -60"
sub "Ficheros compose gestionados (rutas, no contenido con secretos)"
q  "find /DATA /var/lib/casaos /opt /srv /home -maxdepth 5 \\( -name 'docker-compose.y*ml' -o -name 'compose.y*ml' \\) 2>/dev/null | head -60"

# ===========================================================================
sec "4. DOCKER"
DOCKER_OK=0
if have docker && timeout 15 docker info >/dev/null 2>&1; then DOCKER_OK=1; fi
if [ "$DOCKER_OK" -eq 1 ]; then
  q "docker version --format '{{.Server.Version}} (API {{.Server.APIVersion}})' 2>&1"
  q "docker info 2>/dev/null | grep -Ei 'Storage Driver|Logging Driver|Cgroup|Live Restore|Docker Root Dir|Total Memory|Server Version|WARNING'"
  q "docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'"
  q "docker system df -v 2>/dev/null | head -60"
  q "docker volume ls"
  q "docker network ls"

  sub "Detalle por contenedor (política de reinicio, privilegios, red, volúmenes)"
  for c in $(docker ps -aq 2>/dev/null); do
    docker inspect "$c" --format '
CONTENEDOR : {{.Name}}
  imagen        : {{.Config.Image}}
  estado        : {{.State.Status}} (reinicios: {{.RestartCount}})
  restart policy: {{.HostConfig.RestartPolicy.Name}}
  privileged    : {{.HostConfig.Privileged}}
  network mode  : {{.HostConfig.NetworkMode}}
  puertos       : {{range $p, $conf := .HostConfig.PortBindings}}{{$p}} -> {{range $conf}}{{.HostIp}}:{{.HostPort}} {{end}}{{end}}
  montajes      : {{range .Mounts}}[{{.Type}}] {{.Source}} => {{.Destination}} ({{if .RW}}rw{{else}}ro{{end}}) {{end}}
  capacidades   : {{.HostConfig.CapAdd}}
  logs          : {{.HostConfig.LogConfig.Type}} {{.HostConfig.LogConfig.Config}}
  healthcheck   : {{if .Config.Healthcheck}}sí{{else}}NO{{end}}
  variables     : {{range .Config.Env}}{{.}} {{end}}' 2>/dev/null \
      | sed -E 's/(=)[^ ]*/\1***/g; s/^  variables     : \*\*\*/  variables     :/' >>"$OUT"
  done

  sub "Contenedores que montan el socket de Docker (riesgo de escalada)"
  q "docker ps -a --format '{{.Names}}' | while read -r n; do docker inspect \"\$n\" --format '{{range .Mounts}}{{.Source}} {{end}}' | grep -q 'docker.sock' && echo \"\$n\"; done; true"

  sub "Imágenes con etiqueta :latest (versionado no fijado)"
  q "docker ps -a --format '{{.Names}} {{.Image}}' | grep -E ':latest$|^[^ ]+ [^:]+$' || echo 'ninguna'"
else
  if have docker; then
    echo "[docker instalado pero el demonio no responde — ¿servicio parado o falta permiso?]" >>"$OUT"
    q "systemctl status docker --no-pager 2>&1 | head -15"
  else
    echo "[docker no instalado]" >>"$OUT"
  fi
fi
qi podman "podman ps -a"

# ===========================================================================
sec "5. BACKUPS — HERRAMIENTAS DETECTADAS"
sub "Binarios de backup/sincronización presentes"
for b in restic borg borgmatic kopia duplicity duplicacy rclone rsync tar timeshift snapper btrbk zfs-auto-snapshot sanoid syncoid proxmox-backup-client rdiff-backup bacula-fd urbackupclientctl; do
  if have "$b"; then printf 'PRESENTE  %-24s (%s)\n' "$b" "$(command -v "$b")" >>"$OUT"
  else printf 'ausente   %s\n' "$b" >>"$OUT"; fi
done

sub "Contenedores de backup/sync en Docker"
if [ "$DOCKER_OK" -eq 1 ]; then
  q "docker ps -a --format '{{.Names}} {{.Image}}' | grep -Ei 'backup|duplicati|kopia|restic|borg|syncthing|nextcloud|resilio|rclone|urbackup|vorta|autorestic' || echo 'ninguno detectado'"
else
  echo "[docker no consultable]" >>"$OUT"
fi

sub "Ficheros de configuración de backup (presencia)"
for f in /etc/restic /root/.restic /etc/borgmatic /etc/borgmatic.d /root/.config/borg \
         /etc/rclone.conf /root/.config/rclone/rclone.conf /etc/timeshift/timeshift.json \
         /etc/snapper/configs /etc/btrbk/btrbk.conf /etc/sanoid/sanoid.conf \
         /etc/duplicati /etc/kopia /root/.config/kopia /etc/autorestic.yml; do
  exists_note "$f"
done

sub "Remotos rclone configurados (solo nombres, sin credenciales)"
q "grep -hoE '^\\[[^]]+\\]' /root/.config/rclone/rclone.conf /etc/rclone.conf /home/*/.config/rclone/rclone.conf 2>/dev/null || echo 'sin rclone.conf'"

sub "Repositorios restic/borg referenciados en el sistema (rutas, sin claves)"
q "grep -rhoE '(RESTIC_REPOSITORY|BORG_REPO)=[^ \"]*' /etc /root /home --include='*.sh' --include='*.env' --include='*.conf' --include='*.service' 2>/dev/null | sort -u | head -20 || echo 'ninguno'"

sub "Instantáneas existentes (si hay ZFS/btrfs/timeshift)"
qi zfs "zfs list -t snapshot 2>/dev/null | head -40"
qi btrfs "btrfs subvolume list -s / 2>/dev/null | head -40"
qi timeshift "timeshift --list 2>&1 | head -30"
qi snapper "snapper list-configs; snapper list 2>&1 | head -30"

sub "Scripts caseros que parecen de backup"
q "find /root /home /opt /usr/local/bin /usr/local/sbin /srv -maxdepth 4 -type f \\( -name '*backup*' -o -name '*respaldo*' -o -name '*snapshot*' \\) 2>/dev/null | head -40"

sub "Logs de backup recientes"
q "ls -la /var/log/*backup* /var/log/*restic* /var/log/*borg* /var/log/*duplicati* 2>/dev/null || echo 'sin logs de backup en /var/log'"

# ===========================================================================
sec "6. PROGRAMACIÓN DE TAREAS (cron / timers)"
q "crontab -l 2>/dev/null || echo 'root sin crontab'"
sub "crontabs de todos los usuarios"
q "for u in \$(cut -d: -f1 /etc/passwd); do c=\$(crontab -l -u \"\$u\" 2>/dev/null); [ -n \"\$c\" ] && { echo \"### \$u\"; echo \"\$c\"; }; done; true"
q "ls -la /etc/cron.d /etc/cron.daily /etc/cron.weekly /etc/cron.hourly 2>/dev/null"
q "cat /etc/crontab 2>/dev/null; for f in /etc/cron.d/*; do echo \"### \$f\"; cat \"\$f\"; done 2>/dev/null"
q "systemctl list-timers --all --no-pager"
q "systemctl list-unit-files --type=service --state=enabled --no-pager | head -60"
q "systemctl --failed --no-pager"

# ===========================================================================
sec "7. RED"
q "ip -brief addr 2>/dev/null || ifconfig -a 2>/dev/null || echo 'ni ip ni ifconfig disponibles'"
q "ip route 2>/dev/null || route -n 2>/dev/null || true"
q "ss -tulpnH 2>/dev/null | sort -k5 || netstat -tulpn 2>/dev/null || echo 'ni ss ni netstat disponibles'"
q "cat /etc/hosts"
q "resolvectl status 2>/dev/null | head -30 || cat /etc/resolv.conf"
sub "Túneles / VPN / acceso remoto"
for b in tailscale zerotier-cli wg cloudflared ngrok openvpn; do
  have "$b" && printf 'PRESENTE  %s\n' "$b" >>"$OUT" || printf 'ausente   %s\n' "$b" >>"$OUT"
done
qi tailscale "tailscale status 2>&1 | head -20"
qi wg "wg show 2>&1 | sed -E 's/(PrivateKey|PresharedKey).*/\\1 = ***REDACTED***/' | head -30"

# ===========================================================================
sec "8. SEGURIDAD Y ACTUALIZACIONES"
q "ufw status verbose 2>/dev/null || echo 'ufw no disponible'"
q "iptables -S 2>/dev/null | head -40; nft list ruleset 2>/dev/null | head -40"
qi fail2ban-client "fail2ban-client status 2>&1"
sub "Configuración SSH efectiva (parámetros relevantes)"
q "sshd -T 2>/dev/null | grep -Ei 'port|permitrootlogin|passwordauthentication|pubkeyauthentication|permitemptypasswords|x11forwarding|allowusers|allowgroups|maxauthtries|kbdinteractive' || grep -Ev '^\\s*#|^$' /etc/ssh/sshd_config"
q "ls -la /etc/ssh/sshd_config.d/ 2>/dev/null"
sub "Usuarios con shell y claves autorizadas"
q "awk -F: '\$3>=1000 && \$7!~/(nologin|false)/ {print \$1\" uid=\"\$3\" shell=\"\$7}' /etc/passwd; echo '--- root:'; grep '^root:' /etc/passwd"
q "for h in /root /home/*; do k=\"\$h/.ssh/authorized_keys\"; [ -f \"\$k\" ] && echo \"\$k: \$(grep -c . \"\$k\") clave(s) — tipos: \$(awk '{print \$1}' \"\$k\" | sort -u | tr '\\n' ' ')\"; done; true"
q "awk -F: '\$2==\"\" {print \$1\" SIN CONTRASEÑA\"}' /etc/shadow 2>/dev/null; echo ok"
q "ls -la /etc/sudoers.d/ 2>/dev/null; grep -rhE '^[^#].*NOPASSWD' /etc/sudoers /etc/sudoers.d/ 2>/dev/null || echo 'sin reglas NOPASSWD'"
sub "Actualizaciones"
q "cat /etc/apt/apt.conf.d/20auto-upgrades 2>/dev/null || echo 'unattended-upgrades no configurado'"
q "apt-get -s upgrade 2>/dev/null | grep -E '^[0-9]+ upgraded|^Inst' | head -30"
q "ls /var/run/reboot-required* 2>/dev/null && cat /var/run/reboot-required.pkgs 2>/dev/null || echo 'no requiere reinicio'"
qi needrestart "needrestart -b 2>&1 | head -20"

# ===========================================================================
sec "9. SALUD Y MONITORIZACIÓN"
q "journalctl -p 3 -b --no-pager | tail -40"
q "dmesg -T --level=err,crit,alert,emerg 2>/dev/null | tail -30"
q "last -n 15 2>/dev/null"
q "grep -icE 'failed password' /var/log/auth.log 2>/dev/null && echo '(intentos de contraseña fallidos en auth.log)' || echo 'auth.log no legible'"
qi sensors "sensors 2>&1 | head -20"
q "for z in /sys/class/thermal/thermal_zone*/temp; do [ -f \"\$z\" ] && echo \"\$z: \$(awk '{printf \"%.1f C\", \$1/1000}' \"\$z\")\"; done; true"
qi vcgencmd "vcgencmd measure_temp; vcgencmd get_throttled"
sub "Herramientas de monitorización / notificación presentes"
for b in netdata node_exporter zabbix_agentd telegraf msmtp sendmail mailx apprise; do
  have "$b" && printf 'PRESENTE  %s\n' "$b" >>"$OUT" || printf 'ausente   %s\n' "$b" >>"$OUT"
done
if [ "$DOCKER_OK" -eq 1 ]; then
  q "docker ps --format '{{.Names}} {{.Image}}' | grep -Ei 'uptime-kuma|netdata|grafana|prometheus|zabbix|glances|scrutiny|beszel' || echo 'sin contenedores de monitorización'"
fi
q "ls -la /etc/msmtprc /etc/aliases 2>/dev/null | head; echo ok"

# ===========================================================================
sec "10. RESUMEN RÁPIDO"
sum_os="$(. /etc/os-release 2>/dev/null; echo "${PRETTY_NAME:-desconocido}")"
if [ "$DOCKER_OK" -eq 1 ]; then
  sum_docker="$(docker version --format '{{.Server.Version}}' 2>/dev/null | tr -d '\n')"
  sum_run="$(docker ps -q 2>/dev/null | grep -c .)"
  sum_all="$(docker ps -aq 2>/dev/null | grep -c .)"
elif have docker; then
  sum_docker="binario presente, demonio NO responde"; sum_run="?"; sum_all="?"
else
  sum_docker="no instalado"; sum_run=0; sum_all=0
fi
sum_bk=""
for b in restic borg borgmatic kopia duplicity rclone timeshift snapper btrbk sanoid; do
  have "$b" && sum_bk="$sum_bk$b "
done
[ -n "$sum_bk" ] || sum_bk="NINGUNA detectada"
{
  echo "Host              : $(hostname -f 2>/dev/null || hostname)"
  echo "SO                : $sum_os"
  echo "Kernel            : $(uname -r)"
  echo "Uptime            : $(uptime -p 2>/dev/null | tr -d '\n')"
  echo "Docker            : $sum_docker"
  echo "Contenedores      : $sum_run activos / $sum_all totales"
  echo "Herram. backup    : $sum_bk"
  echo "Firewall ufw      : $(ufw status 2>/dev/null | head -1 | tr -d '\n' || echo 'n/d')"
  echo "Reinicio pendiente: $([ -f /var/run/reboot-required ] && echo SÍ || echo no)"
  echo "Uso raíz (/)      : $(df -h / | awk 'NR==2{print $3" de "$2" ("$5")"}')"
} >>"$OUT"

# ===========================================================================
# Enmascarado de posibles credenciales
if [ "$REDACT" -eq 1 ]; then
  sed -i -E \
    -e 's/([A-Za-z_]*(PASS|PASSWD|PASSWORD|SECRET|TOKEN|APIKEY|API_KEY|PRIVATE_KEY|CREDENTIAL|SALT)[A-Za-z_]*)[[:space:]]*[=:][[:space:]]*[^[:space:]"]+/\1=***REDACTED***/Ig' \
    -e 's#(://[^:/@[:space:]]+):[^@[:space:]]+@#\1:***REDACTED***@#g' \
    -e 's/(PrivateKey|PresharedKey)[[:space:]]*=[[:space:]]*[^[:space:]]+/\1 = ***REDACTED***/Ig' \
    -e 's/(BEGIN [A-Z ]*PRIVATE KEY).*/\1 ***CONTENIDO OMITIDO***/g' \
    "$OUT"
fi

chmod 600 "$OUT" 2>/dev/null
echo
echo "Informe generado: $OUT"
echo "Tamaño: $(du -h "$OUT" | cut -f1)  Líneas: $(wc -l <"$OUT")"
echo
echo "Antes de compartirlo, revísalo:  less \"$OUT\""
echo "Busca credenciales que se hayan escapado:  grep -inE 'pass|secret|token|key' \"$OUT\""

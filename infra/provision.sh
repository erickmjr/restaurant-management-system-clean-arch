#!/usr/bin/env bash
set -euo pipefail

# Prepara uma VM Ubuntu 24.04 limpa da Oracle Cloud para receber a API.
# Idempotente, rodar de novo nao quebra nada.
# Nao instala a aplicacao e nao abre as portas 80 e 443, isso e passo de deploy.

APP_USER="${APP_USER:-caixa}"
APP_DIR="${APP_DIR:-/opt/caixa}"
SSH_ALLOW_USER="${SSH_ALLOW_USER:-ubuntu}"
REBOOT_TIME_UTC="${REBOOT_TIME_UTC:-07:00}"

if [[ "${EUID}" -ne 0 ]]; then
	echo "rode com sudo" >&2
	exit 1
fi

echo "==> atualizando o sistema"
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a
apt-get update
apt-get upgrade -y -o Dpkg::Options::=--force-confold
apt-get autoremove --purge -y

echo "==> relogio em UTC e NTP"
# O codigo da aplicacao calcula o dia comercial com deslocamento proprio.
# Manter o sistema em UTC evita duas fontes de verdade sobre que dia e hoje.
timedatectl set-timezone Etc/UTC
timedatectl set-ntp true

echo "==> endurecendo o ssh"
# No sshd vale o PRIMEIRO valor encontrado, e os drop-ins sao lidos em ordem
# lexicografica. Por isso 10, para ganhar do 60-cloudimg-settings.conf.
tee /etc/ssh/sshd_config.d/10-hardening.conf > /dev/null <<EOF
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 3
MaxStartups 3:50:10
PerSourceMaxStartups 3
LoginGraceTime 20
X11Forwarding no
AllowUsers ${SSH_ALLOW_USER}
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

sshd -t
# Com ativacao por socket no 24.04 nao existe reload, cada conexao nova sobe um
# sshd que le a configuracao do zero. Sessao aberta nao e afetada.

echo "==> atualizacoes automaticas de seguranca"
# No apt vale o ULTIMO valor, o inverso do sshd. Por isso 52, para ganhar do 50.
tee /etc/apt/apt.conf.d/52unattended-upgrades-local > /dev/null <<EOF
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "${REBOOT_TIME_UTC}";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF

tee /etc/apt/apt.conf.d/20auto-upgrades > /dev/null <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

echo "==> usuario e diretorio da aplicacao"
if ! id -u "${APP_USER}" > /dev/null 2>&1; then
	useradd --system --shell /usr/sbin/nologin --home-dir "${APP_DIR}" "${APP_USER}"
fi
install -d -o "${APP_USER}" -g "${APP_USER}" -m 750 "${APP_DIR}"

echo
echo "==> conferencia"
sshd -T | grep -Ei 'permitrootlogin|passwordauthentication|maxauthtries|maxstartups|logingracetime|allowusers|x11forwarding'
echo
timedatectl | grep -Ei 'time zone|synchronized|ntp service'
echo
id "${APP_USER}"
ls -ld "${APP_DIR}"
echo
echo "cadeia INPUT atual, o REJECT precisa continuar sendo a ultima regra"
iptables -L INPUT -n -v --line-numbers
echo

if [[ -f /var/run/reboot-required ]]; then
	echo "REINICIO PENDENTE, rode: sudo reboot"
else
	echo "sem reinicio pendente"
fi

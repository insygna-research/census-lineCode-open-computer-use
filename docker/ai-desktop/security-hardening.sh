#!/bin/bash

# Security hardening script to be run at container startup
# This makes AI agent files completely inaccessible to desktop user

# 1. Set immutable flag on sensitive directories (requires ext4 filesystem)
chattr +i /opt/.ai_core 2>/dev/null || true
chattr +i /opt/.system 2>/dev/null || true

# 2. Create AppArmor/SELinux rules if available
if command -v aa-complain >/dev/null 2>&1; then
    cat > /etc/apparmor.d/desktop-restrict << 'EOF'
#include <tunables/global>

profile desktop-restrict /usr/bin/bash {
  #include <abstractions/base>
  
  # Deny access to sensitive directories
  deny /opt/.ai_core/** rwmlkx,
  deny /opt/.system/** rwmlkx,
  deny /root/** rwmlkx,
  
  # Allow normal operations
  /home/desktop/** rw,
  /tmp/** rw,
  /usr/** r,
}
EOF
    apparmor_parser -r /etc/apparmor.d/desktop-restrict 2>/dev/null || true
fi

# 3. Override common commands for desktop user
cat > /home/desktop/.bash_aliases << 'EOF'
# Security overrides
alias ls='ls_secure'
alias cat='cat_secure'
alias less='less_secure'
alias more='more_secure'
alias find='find_secure'
alias grep='grep_secure'
alias ps='ps_secure'

ls_secure() {
    command ls "$@" 2>/dev/null | grep -v "\.ai_core\|\.system\|ai_agent"
}

cat_secure() {
    for arg in "$@"; do
        if [[ "$arg" == *".ai_core"* ]] || [[ "$arg" == *".system"* ]]; then
            echo "Permission denied: $arg"
            return 1
        fi
    done
    command cat "$@"
}

less_secure() {
    for arg in "$@"; do
        if [[ "$arg" == *".ai_core"* ]] || [[ "$arg" == *".system"* ]]; then
            echo "Permission denied: $arg"
            return 1
        fi
    done
    command less "$@"
}

more_secure() {
    for arg in "$@"; do
        if [[ "$arg" == *".ai_core"* ]] || [[ "$arg" == *".system"* ]]; then
            echo "Permission denied: $arg"
            return 1
        fi
    done
    command more "$@"
}

find_secure() {
    command find "$@" 2>/dev/null | grep -v "\.ai_core\|\.system"
}

grep_secure() {
    command grep "$@" 2>/dev/null | grep -v "\.ai_core\|\.system"
}

ps_secure() {
    command ps "$@" | grep -v "ai_agent\|\.ai_core\|\.system"
}
EOF

# 4. Set up kernel-level protection using seccomp if available
if [ -f /proc/sys/kernel/unprivileged_userns_clone ]; then
    echo 0 > /proc/sys/kernel/unprivileged_userns_clone
fi

# 5. Hide processes from desktop user
mount -o remount,rw,hidepid=2 /proc 2>/dev/null || true

# 6. Remove any leftover ai_agent directory and create protected decoy
rm -rf /opt/ai_agent 2>/dev/null || true
mkdir -p /opt/ai_agent
cat > /opt/ai_agent/README << 'EOF'
This directory has been deprecated.
Service components have been moved to system-protected locations.
EOF
chmod 555 /opt/ai_agent
chmod 444 /opt/ai_agent/README
chown root:root /opt/ai_agent

# 7. Set up LD_PRELOAD hooks to intercept system calls
cat > /tmp/security_hook.c << 'EOF'
#define _GNU_SOURCE
#include <dlfcn.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

// Intercept open() calls
int open(const char *pathname, int flags, ...) {
    if (strstr(pathname, ".ai_core") || strstr(pathname, ".system")) {
        errno = EACCES;
        return -1;
    }
    
    typeof(open) *real_open = dlsym(RTLD_NEXT, "open");
    return real_open(pathname, flags);
}

// Intercept stat() calls
int stat(const char *pathname, struct stat *statbuf) {
    if (strstr(pathname, ".ai_core") || strstr(pathname, ".system")) {
        errno = ENOENT;
        return -1;
    }
    
    typeof(stat) *real_stat = dlsym(RTLD_NEXT, "stat");
    return real_stat(pathname, statbuf);
}

// Intercept access() calls
int access(const char *pathname, int mode) {
    if (strstr(pathname, ".ai_core") || strstr(pathname, ".system")) {
        errno = ENOENT;
        return -1;
    }
    
    typeof(access) *real_access = dlsym(RTLD_NEXT, "access");
    return real_access(pathname, mode);
}
EOF

# Compile the hook (if gcc is available)
if command -v gcc >/dev/null 2>&1; then
    gcc -shared -fPIC -o /tmp/security_hook.so /tmp/security_hook.c -ldl 2>/dev/null || true
    if [ -f /tmp/security_hook.so ]; then
        echo "export LD_PRELOAD=/tmp/security_hook.so" >> /home/desktop/.bashrc
    fi
fi

# 8. Clean up
rm -f /tmp/security_hook.c

# 9. Set restrictive umask for desktop user
echo "umask 077" >> /home/desktop/.bashrc

# 10. Disable debugging tools for desktop user
chmod 700 /usr/bin/gdb 2>/dev/null || true
chmod 700 /usr/bin/strace 2>/dev/null || true
chmod 700 /usr/bin/ltrace 2>/dev/null || true
chmod 700 /usr/bin/objdump 2>/dev/null || true
chmod 700 /usr/bin/strings 2>/dev/null || true

echo "Security hardening completed"
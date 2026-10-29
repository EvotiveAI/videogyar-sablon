#!/bin/zsh
# Gép-állapot egy JSON-ban a /heat panelhez (könnyű: ps, vm_stat, pmset, df; ~20–50 ms).
LOCK="${TMPDIR:-/tmp}/video-vagas-nehez.lock"

# CPU összesen (a ps %CPU összege, magonként 100%), top 6 folyamat
cpu_lines=$(ps -Ao pcpu=,rss=,comm= -r)
total_cpu=$(print -r -- "$cpu_lines" | awk '{s+=$1} END {printf "%.0f", s}')
ncpu=$(sysctl -n hw.ncpu)
top_cpu=$(print -r -- "$cpu_lines" | head -6 | awk '{c=$1; m=$2; $1=""; $2=""; sub(/^  /,""); n=$0; sub(/.*\//,"",n); gsub(/"/,"",n); printf "%s{\"name\":\"%s\",\"cpu\":%.0f,\"mb\":%.0f}", (NR>1?",":""), n, c, m/1024}')

# Memória alkalmazásonként csoportosítva (top 6)
apps=$(ps -Ao rss=,comm= | awk '{m=$1; $1=""; n=$0;
  if (n ~ /Claude Helper|Claude\.app|\/claude$|claude-code/) k="Claude";
  else if (n ~ /Google Chrome|chrome-headless/) k="Chrome";
  else if (n ~ /Arc\.app|Browser Helper/) k="Arc";
  else if (n ~ /HyperFrames/) k="HyperFrames Studio";
  else if (n ~ /Wispr/) k="Wispr Flow";
  else if (n ~ /ffmpeg/) k="ffmpeg";
  else if (n ~ /whisper/) k="whisper";
  else if (n ~ /node$/) k="node";
  else if (n ~ /WindowServer/) k="WindowServer";
  else k="egyéb";
  s[k]+=m} END {for (k in s) printf "%d %s\n", s[k]/1024, k}' | sort -rn | head -7 | awk '{m=$1; $1=""; sub(/^ /,""); printf "%s{\"name\":\"%s\",\"mb\":%d}", (NR>1?",":""), $0, m}')

# Memória szabad %
mem_free=$(memory_pressure 2>/dev/null | awk -F': ' '/free percentage/ {gsub(/%/,"",$2); print $2}')
[[ -z "$mem_free" ]] && mem_free=-1
swap_mb=$(sysctl -n vm.swapusage | awk '{gsub(/M/,"",$6); printf "%.0f", $6}')

# Hő: pmset (CPU_Speed_Limit 100 = nincs fojtás) + figyelmeztetési szint
therm=$(pmset -g therm 2>/dev/null)
speed=$(print -r -- "$therm" | awk -F'= ' '/CPU_Speed_Limit/ {print $2}')
[[ -z "$speed" ]] && speed=100
warn=$(print -r -- "$therm" | grep -ciE "warning level (has been|is) (recorded|[1-9])" )
if print -r -- "$therm" | grep -qi "No thermal warning level has been recorded"; then warn=0; fi

# Lemez
disk_free=$(df -g / | awk 'NR==2 {print $4}')

# Nehéz videós folyamatok
heavy=$(ps -Ao pid=,pcpu=,etime=,command= | grep -E "ffmpeg|whisper|chrome-headless|hyperframes(@[0-9.]+)? (render|check|snapshot)|vagas\.py|record\.mjs" | grep -v grep | head -6 | awk '{pid=$1; c=$2; t=$3; $1=$2=$3=""; sub(/^ +/,""); cmd=substr($0,1,70); gsub(/"/,"",cmd); gsub(/\\/,"",cmd); printf "%s{\"pid\":%s,\"cpu\":%.0f,\"time\":\"%s\",\"cmd\":\"%s\"}", (NR>1?",":""), pid, c, t, cmd}')

# egyszerre.sh zár (3 hely: .lock, .lock.2, .lock.3)
lock_pid=""; lock_cmd=""
for d in "$LOCK" "$LOCK.2" "$LOCK.3"; do
  if [[ -f "$d/pid" ]]; then
    p=$(cat "$d/pid")
    c=$(ps -o command= -p "$p" 2>/dev/null | sed 's/.*egyszerre.sh //' | cut -c1-45 | tr -d '"\\')
    lock_pid="${lock_pid:+$lock_pid,}$p"; lock_cmd="${lock_cmd:+$lock_cmd | }$c"
  fi
done

printf '{"ncpu":%s,"cpu":%s,"memFree":%s,"swapMb":%s,"speedLimit":%s,"thermWarn":%s,"diskFreeGb":%s,"top":[%s],"apps":[%s],"heavy":[%s],"lock":{"pid":"%s","cmd":"%s"}}\n' \
  "$ncpu" "$total_cpu" "$mem_free" "${swap_mb:-0}" "$speed" "${warn:-0}" "${disk_free:-0}" "$top_cpu" "$apps" "$heavy" "$lock_pid" "$lock_cmd"

#!/bin/bash
cd /home/ubuntu/evolution-core/scripts
nohup python3 worker.py > /tmp/evolution_core_worker.log 2>&1 &
echo "Worker de memória iniciado. Logs em /tmp/evolution_core_worker.log"

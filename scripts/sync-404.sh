#!/usr/bin/env sh
# GitHub Pages serve 404.html para qualquer caminho desconhecido (/github-timeline/<usuario>).
# Mantém 404.html idêntico ao index.html — rode após editar o index.
set -e
cd "$(dirname "$0")/.."
cp index.html 404.html
echo "404.html sincronizado"

// auditor-react.js
// Auditor + Auto-Fix para padrões perigosos no React
// Autor: Rodrigo Borges + ChatGPT 😎

const fs = require("fs");
const path = require("path");
const { glob } = require("glob"); // <-- A CORREÇÃO ESTÁ AQUI

const projectDir = process.cwd();

// Regras e correções automáticas
const patterns = [
  {
    name: "key_insegura_ou_faltando",
    regex: /\.map\s*\((\w+)(?:,\s*\w+)?\)\s*=>\s*\(?(<)/,
    description: "Lista sem 'key' ou com 'key' insegura",
    fix: (line, match) => {
      if (!/key=/.test(line)) {
        return line.replace(/<(\w+)/, `<$1 key={\`${match[1]}-\${index}\`}`);
      }
      return line;
    }
  },
  {
    name: "render_condicional_bloque",
    regex: /\{\s*([\w\d_\.]+)\s*&&\s*(<\w+)/,
    description: "Renderização condicional de bloco — trocar por display:none",
    fix: (line, match) => {
      const cond = match[1];
      return `<div style={{ display: ${cond} ? 'block' : 'none' }}>${line.replace(/\{\s*[\w\d_\.]+\s*&&\s*/, "").replace(/\}$/, "")}</div>`;
    }
  },
  {
    name: "multiplos_setState",
    regex: /set[A-Z]\w+\(.*\)\s*;\s*set[A-Z]\w+\(/,
    description: "Múltiplos setState seguidos — agrupar",
    fix: (line) => `// ⚠️ Recomendação: agrupar esses setState num único callback\n${line}`
  }
];

// Função para processar arquivos
function processFile(filePath) {
  const originalContent = fs.readFileSync(filePath, "utf8");
  const lines = originalContent.split("\n");
  let modified = false;
  let alerts = [];

  patterns.forEach(pattern => {
    lines.forEach((line, index) => {
      const match = pattern.regex.exec(line);
      if (match) {
        alerts.push({
          type: pattern.name,
          description: pattern.description,
          line: index + 1,
          code: line.trim()
        });

        // Aplicar correção
        const fixedLine = pattern.fix(line, match);
        if (fixedLine !== line) {
          lines[index] = fixedLine;
          modified = true;
        }
      }
    });
  });

  // Salvar se houve modificação
  if (modified) {
    const backupPath = `${filePath}.bak`;
    fs.writeFileSync(backupPath, originalContent, "utf8");
    fs.writeFileSync(filePath, lines.join("\n"), "utf8");
  }

  return alerts;
}

// Rodar auditoria
glob(`${projectDir}/**/*.{js,jsx}`, { ignore: "**/node_modules/**" }, (err, files) => {
  if (err) {
    console.error("Erro ao buscar arquivos:", err);
    return;
  }

  let totalAlerts = [];
  files.forEach(file => {
    const alerts = processFile(file);
    if (alerts.length > 0) {
      totalAlerts.push({ file, alerts });
    }
  });

  if (totalAlerts.length === 0) {
    console.log("✅ Nenhum problema encontrado!");
  } else {
    console.log("⚠️  Problemas encontrados e (quando possível) corrigidos automaticamente:");
    totalAlerts.forEach(result => {
      console.log(`\n📄 Arquivo: ${path.relative(projectDir, result.file)}`);
      result.alerts.forEach(a => {
        console.log(`  [${a.type}] Linha ${a.line}: ${a.description}`);
        console.log(`    Código original: ${a.code}`);
      });
    });
    console.log("\n💾 Correções aplicadas em arquivos originais. Backups salvos como *.bak");
  }
});
const CSV_URL = "data/org.csv";
const REFRESH_MS = 2000;

const state = {
  rawCsv: "",
  records: [],
  areaFilter: "all",
  searchQuery: "",
  lastUpdated: null,
};

const els = {
  tree: document.getElementById("tree"),
  feedback: document.getElementById("feedback"),
  peopleCount: document.getElementById("peopleCount"),
  areaCount: document.getElementById("areaCount"),
  lastUpdated: document.getElementById("lastUpdated"),
  autoStatus: document.getElementById("autoStatus"),
  searchInput: document.getElementById("searchInput"),
  areaFilter: document.getElementById("areaFilter"),
  showAllBtn: document.getElementById("showAllBtn"),
};

function normalize(value) {
  return String(value ?? "").trim();
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (!lines.length) throw new Error("O CSV está vazio.");

  const headers = splitCsvLine(lines[0]).map((header) => normalize(header));
  const required = ["id", "parent_id", "nome", "cargo", "area", "nivel", "tipo", "status"];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) {
    throw new Error(`CSV inválido. Faltam colunas: ${missing.join(", ")}.`);
  }

  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line);
    const record = {};

    headers.forEach((header, position) => {
      record[header] = normalize(values[position]);
    });

    if (!record.id) {
      throw new Error(`Linha ${index + 2}: campo "id" obrigatório.`);
    }

    return {
      ...record,
      nivel: Number(record.nivel) || 0,
      status: record.status || "ativo",
    };
  });
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function buildTree(records) {
  const byId = new Map();
  const nodes = records.map((record) => ({ ...record, children: [] }));
  nodes.forEach((node) => byId.set(node.id, node));

  const roots = [];
  nodes.forEach((node) => {
    const parentId = normalize(node.parent_id);
    const parent = parentId ? byId.get(parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  return { roots, byId };
}

function collectStats(records) {
  return {
    people: records.filter((item) => item.tipo === "pessoa").length,
    areas: records.filter((item) => item.tipo === "area").length,
  };
}

function buildAreaOptions(records) {
  const areaNames = [...new Set(records.map((item) => item.area).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  const currentValue = els.areaFilter.value || "all";

  els.areaFilter.innerHTML = '<option value="all">Todas as áreas</option>';
  areaNames.forEach((area) => {
    const option = document.createElement("option");
    option.value = area;
    option.textContent = area;
    els.areaFilter.appendChild(option);
  });

  els.areaFilter.value = areaNames.includes(currentValue) ? currentValue : "all";
  state.areaFilter = els.areaFilter.value;
}

function matchesFilters(node) {
  const search = state.searchQuery.toLowerCase();
  const areaMatch = state.areaFilter === "all" || node.area === state.areaFilter;
  const searchMatch =
    !search ||
    node.nome.toLowerCase().includes(search) ||
    node.cargo.toLowerCase().includes(search);
  return areaMatch && searchMatch;
}

function filterNode(node) {
  const nodeMatches = matchesFilters(node);
  const filteredChildren = (node.children || [])
    .map(filterNode)
    .filter(Boolean);

  const shouldKeepForContext =
    filteredChildren.length > 0 &&
    (node.tipo === "area" || node.nivel === 1 || nodeMatches);

  if (nodeMatches || shouldKeepForContext) {
    return { ...node, children: filteredChildren };
  }

  return null;
}

function cardColorClass(node) {
  return node.tipo === "area" ? "area" : "person";
}

function renderCard(node) {
  const el = document.createElement("article");
  el.className = `node level-${Math.min(node.nivel, 4)} ${node.tipo}`;

  const card = document.createElement("div");
  card.className = "card";
  if (node.nivel === 1) card.dataset.accent = "1";

  const top = document.createElement("div");
  top.className = "card-top";

  const content = document.createElement("div");
  content.innerHTML = `
    <h${Math.min(node.nivel, 4) + 1} class="name">${escapeHtml(node.nome)}</h${Math.min(node.nivel, 4) + 1}>
    <div class="role">${escapeHtml(node.cargo)}</div>
  `;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `
    <span class="tag ${cardColorClass(node)}">${escapeHtml(node.tipo)}</span>
    <span class="tag level">Nível ${escapeHtml(node.nivel)}</span>
    <span class="tag level">${escapeHtml(node.area || "Sem área")}</span>
  `;

  content.appendChild(meta);
  top.appendChild(content);
  card.appendChild(top);
  el.appendChild(card);
  return el;
}

function renderNode(node) {
  const wrapper = document.createElement("div");
  wrapper.className = `node level-${Math.min(node.nivel, 4)} ${node.tipo === "area" ? "area-node" : "person-node"}`;
  wrapper.appendChild(renderCard(node));

  if (node.children && node.children.length) {
    const children = document.createElement("div");
    children.className =
      node.nivel === 1
        ? "children root-children"
        : node.tipo === "area"
          ? "children people"
          : "children people";

    if (node.nivel === 1) {
      const areasGrid = document.createElement("div");
      areasGrid.className = "areas-grid";
      node.children.forEach((child) => {
        const childRendered = renderNode(child);
        if (childRendered) areasGrid.appendChild(childRendered);
      });
      children.appendChild(areasGrid);
    } else {
      node.children.forEach((child) => {
        const childRendered = renderNode(child);
        if (childRendered) children.appendChild(childRendered);
      });
    }

    if (children.childElementCount > 0) {
      wrapper.appendChild(children);
    }
  }

  return wrapper;
}

function render(records) {
  const treeData = buildTree(records);
  const filteredRoots = treeData.roots
    .map(filterNode)
    .filter(Boolean);

  const stats = collectStats(records);
  els.peopleCount.textContent = String(stats.people);
  els.areaCount.textContent = String(stats.areas);
  els.lastUpdated.textContent = state.lastUpdated
    ? state.lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--";

  els.tree.innerHTML = "";

  if (!filteredRoots.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nenhum resultado encontrado para os filtros atuais.";
    els.tree.appendChild(empty);
    return;
  }

  filteredRoots.forEach((root) => {
    els.tree.appendChild(renderNode(root));
  });
}

function setError(message) {
  els.feedback.hidden = false;
  els.feedback.textContent = message;
}

function clearError() {
  els.feedback.hidden = true;
  els.feedback.textContent = "";
}

async function fetchCsv(force = false) {
  const url = `${CSV_URL}?v=${Date.now()}`;
  const response = await fetch(url, { cache: force ? "no-store" : "default" });
  if (!response.ok) {
    throw new Error("Não foi possível ler o arquivo CSV.");
  }
  return response.text();
}

async function syncData() {
  try {
    const csvText = await fetchCsv();
    if (csvText === state.rawCsv && state.records.length) {
      state.lastUpdated = new Date();
      clearError();
      els.lastUpdated.textContent = state.lastUpdated.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      return;
    }

    const parsed = parseCsv(csvText);
    state.rawCsv = csvText;
    state.records = parsed;
    state.lastUpdated = new Date();
    buildAreaOptions(parsed);
    clearError();
    render(parsed);
  } catch (error) {
    setError(error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o organograma.");
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyFilters() {
  if (!state.records.length) return;
  render(state.records);
}

els.searchInput.addEventListener("input", (event) => {
  state.searchQuery = event.target.value;
  applyFilters();
});

els.areaFilter.addEventListener("change", (event) => {
  state.areaFilter = event.target.value;
  applyFilters();
});

els.showAllBtn.addEventListener("click", () => {
  state.searchQuery = "";
  state.areaFilter = "all";
  els.searchInput.value = "";
  els.areaFilter.value = "all";
  applyFilters();
});

els.autoStatus.textContent = "Auto atualização ativa";

syncData();
setInterval(syncData, REFRESH_MS);
const API = 'http://localhost:3000';

// Formatação para R$
const valorInput = document.getElementById("valor");
valorInput.addEventListener("input", () => {
  let num = valorInput.value.replace(/\D/g, "");
  if (num === "") {
    valorInput.value = "";
    return;
  }
  num = (parseInt(num) / 100).toFixed(2).replace(".", ",");
  valorInput.value = "R$ " + num;
});

// Converter dd/mm/aaaa
function formatarDataBR(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

async function fetchDoadores() {
  const res = await fetch(`${API}/doadores`);
  const data = await res.json();
  const sel = document.getElementById('doador_id');
  sel.innerHTML = '<option value="">— Selecionar doador —</option>';
  
  data.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = `${d.nome} ${d.telefone ? '- ' + d.telefone : ''}`;
    sel.appendChild(opt);
  });
}

document.getElementById('formDoador').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const email = document.getElementById('email').value.trim();

  const res = await fetch(`${API}/doadores`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ nome, telefone, email })
  });

  if(res.ok) {
    document.getElementById('msgDoador').textContent = 'Doador cadastrado com sucesso.';
    document.getElementById('formDoador').reset();
    fetchDoadores();
    setTimeout(()=> document.getElementById('msgDoador').textContent='', 3000);
  }
});

document.getElementById('formDoacao').addEventListener('submit', async (e) => {
  e.preventDefault();

  const doador_id = document.getElementById('doador_id').value || null;
  const tipo = document.getElementById('tipo').value;
  const descricao = document.getElementById('descricao').value.trim();
  const quantidade = parseInt(document.getElementById('quantidade').value) || 1;

  let valor = valorInput.value.replace(/\D/g, "");
  valor = valor ? parseFloat(valor) / 100 : 0;

  const data = document.getElementById('data').value;

  const body = { 
    doador_id: doador_id ? Number(doador_id) : null, 
    tipo, 
    descricao, 
    quantidade, 
    valor,
    data 
  };

  const res = await fetch(`${API}/doacoes`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });

  if(res.ok) {
    document.getElementById('msgDoacao').textContent = 'Doação registrada.';
    document.getElementById('formDoacao').reset();
    listar();
    setTimeout(()=> document.getElementById('msgDoacao').textContent='', 3000);
  }
});

async function listar(tipo='', inicio='', fim='') {
  let url = `${API}/doacoes`;
  const params = new URLSearchParams();
  
  if(tipo) params.append('tipo', tipo);
  if(inicio) params.append('data_inicio', inicio);
  if(fim) params.append('data_fim', fim);

  if([...params].length) url += '?' + params.toString();

  const res = await fetch(url);
  const data = await res.json();

  const lista = document.getElementById('lista');
  lista.innerHTML = '';

  data.forEach(d => {
    const div = document.createElement('div');
    div.className = 'item';

    const nome = d.nome_doador || "Doador não informado";
    const dataBR = formatarDataBR(d.data);

    let info = "";

    if(d.tipo === "financeira") {
      const valorBR = d.valor ? d.valor.toFixed(2).replace(".", ",") : "0,00";
      info = `${nome} • ${dataBR} • Valor: R$ ${valorBR}`;
    } 
    else {
      info = `${nome} • ${dataBR} • Item: ${d.descricao} • Quantidade: ${d.quantidade}`;
    }

    div.innerHTML = `
      <div>
        <strong>${d.tipo.toUpperCase()}</strong>
        <div class="small">${info}</div>
      </div>
    `;

    lista.appendChild(div);
  });
}

document.getElementById('btnFiltrar').addEventListener('click', () => {
  listar(
    document.getElementById('filtroTipo').value,
    document.getElementById('fdataIni').value,
    document.getElementById('fdataFim').value
  );
});

window.onload = () => {
  fetchDoadores();
  listar();
};

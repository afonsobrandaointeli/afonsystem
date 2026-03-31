async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

async function loadCharts() {
  const q = typeof filterQuery !== 'undefined' ? filterQuery : '';

  const [cps, cot, lps, mrs, iss] = await Promise.all([
    fetchJSON(`/api/commits-per-student?${q}`),
    fetchJSON(`/api/commits-over-time?${q}`),
    fetchJSON(`/api/lines-per-student?${q}`),
    fetchJSON(`/api/mr-status?${q}`),
    fetchJSON(`/api/issue-status?${q}`),
  ]);

  const palette = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc948','#b07aa1','#ff9da7'];

  if (document.getElementById('commitsPerStudentChart')) {
    new Chart(document.getElementById('commitsPerStudentChart'), {
      type: 'bar',
      data: { labels: cps.labels, datasets: [{ ...cps.datasets[0], backgroundColor: palette }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    });
  }

  if (document.getElementById('commitsOverTimeChart')) {
    new Chart(document.getElementById('commitsOverTimeChart'), {
      type: 'line',
      data: { labels: cot.labels, datasets: [{ ...cot.datasets[0], borderColor: '#4e79a7', fill: true, backgroundColor: 'rgba(78,121,167,0.15)' }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    });
  }

  if (document.getElementById('linesPerStudentChart')) {
    new Chart(document.getElementById('linesPerStudentChart'), {
      type: 'bar',
      data: { labels: lps.labels, datasets: [{ ...lps.datasets[0], backgroundColor: palette }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } } },
    });
  }

  if (document.getElementById('mrStatusChart')) {
    new Chart(document.getElementById('mrStatusChart'), {
      type: 'doughnut',
      data: { labels: mrs.labels, datasets: [{ ...mrs.datasets[0], backgroundColor: ['#59a14f','#4e79a7','#e15759'] }] },
    });
  }

  if (document.getElementById('issueStatusChart')) {
    new Chart(document.getElementById('issueStatusChart'), {
      type: 'doughnut',
      data: { labels: iss.labels, datasets: [{ ...iss.datasets[0], backgroundColor: ['#59a14f','#f28e2b'] }] },
    });
  }
}

document.addEventListener('DOMContentLoaded', loadCharts);

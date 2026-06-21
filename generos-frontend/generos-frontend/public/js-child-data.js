// ============================
// CHILD DATA PAGE
// ============================
let cdCurrentStep = 1;
let cdData = {};

async function loadChildDataPage() {
  try {
    const data = await Api.getChildProfile();
    cdData = data.child || {};
    renderChildCard(data);
  } catch (err) {
    console.error('Load child data error:', err);
  }
}

function renderChildCard(data) {
  const child = data.child || {};
  
  // Avatar
  const avatar = document.getElementById('cd-avatar');
  if (child.photo) {
    avatar.innerHTML = `<img src="${escapeHtml(child.photo)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  } else {
    const initial = (child.name || 'A')[0].toUpperCase();
    avatar.textContent = initial;
  }

  document.getElementById('cd-name').textContent = child.name || 'Belum diisi';
  document.getElementById('cd-age').textContent = child.age || '-';

  // Stats
  const g = data.growth || {};
  document.getElementById('cd-stat-bb').textContent = g.weight_kg ? `${g.weight_kg} kg` : '-';
  document.getElementById('cd-stat-tb').textContent = g.height_cm ? `${g.height_cm} cm` : '-';
  document.getElementById('cd-stat-gizi').textContent = data.nutrition_status || '-';
  document.getElementById('cd-stat-perkembangan').textContent = data.development_status || '-';

  // Mini cards
  document.getElementById('cd-mini-bb').textContent = g.weight_kg ? `${g.weight_kg} kg` : '-';
  document.getElementById('cd-mini-tb').textContent = g.height_cm ? `${g.height_cm} cm` : '-';
  document.getElementById('cd-mini-gizi').textContent = data.nutrition_status || '-';
  document.getElementById('cd-mini-perkembangan').textContent = data.development_status || '-';
}

// ============================
// MULTI-STEP FORM WIZARD
// ============================
function openChildForm() {
  cdCurrentStep = 1;
  
  // Pre-fill form with existing data
  document.getElementById('cd-fullname').value = cdData.name || '';
  document.getElementById('cd-nickname').value = cdData.nickname || '';
  document.getElementById('cd-dob').value = cdData.dob || '';
  document.getElementById('cd-gender').value = cdData.gender || '';
  document.getElementById('cd-birth-weight').value = cdData.birth_weight || '';
  document.getElementById('cd-birth-height').value = cdData.birth_height || '';
  document.getElementById('cd-birth-head').value = cdData.birth_head_circumference || '';
  document.getElementById('cd-father-name').value = cdData.father_name || '';
  document.getElementById('cd-mother-name').value = cdData.mother_name || '';
  document.getElementById('cd-parent-notes').value = cdData.parent_notes || '';

  showStep(1);
  document.getElementById('child-form-modal').classList.remove('hidden');
}

function closeChildForm() {
  document.getElementById('child-form-modal').classList.add('hidden');
}

function showStep(step) {
  cdCurrentStep = step;
  
  // Hide all steps
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`cd-step-${i}`);
    if (el) el.style.display = i === step ? 'block' : 'none';
  }

  // Update title
  const titles = ['Data Dasar', 'Data Kelahiran', 'Informasi Orang Tua', 'Konfirmasi Data'];
  document.getElementById('child-form-title').textContent = titles[step - 1];

  // Step dots
  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    const idx = i + 1;
    dot.classList.remove('active', 'done');
    if (idx === step) { dot.classList.add('active'); dot.style.background = '#E8682E'; }
    else if (idx < step) { dot.classList.add('done'); dot.style.background = '#E8682E'; }
    else { dot.style.background = '#ddd'; }
  });

  // Buttons
  const prevBtn = document.getElementById('cd-prev-step');
  const nextBtn = document.getElementById('cd-next-step');
  
  prevBtn.style.display = step === 1 ? 'none' : 'block';
  nextBtn.textContent = step === 4 ? '✅ Simpan Data' : 'Lanjut →';
  nextBtn.style.display = 'block';
  
  // If step 4, build review
  if (step === 4) buildReview();
}

function prevStep() {
  if (cdCurrentStep > 1) showStep(cdCurrentStep - 1);
}

function nextStep() {
  if (cdCurrentStep < 4) {
    showStep(cdCurrentStep + 1);
  } else {
    submitChildData();
  }
}

function buildReview() {
  const data = collectFormData();
  const genderMap = { male: 'Laki-laki', female: 'Perempuan', '': '-' };
  
  const html = `
    <div class="cd-review-section">
      <div class="cd-review-title">📋 Data Dasar</div>
      <div class="cd-review-item"><span class="cd-review-label">Nama Lengkap</span><span class="cd-review-value">${escapeHtml(data.child_name) || '-'}</span></div>
      <div class="cd-review-item"><span class="cd-review-label">Nama Panggilan</span><span class="cd-review-value">${escapeHtml(data.child_nickname) || '-'}</span></div>
      <div class="cd-review-item"><span class="cd-review-label">Tanggal Lahir</span><span class="cd-review-value">${data.child_dob || '-'}</span></div>
      <div class="cd-review-item"><span class="cd-review-label">Jenis Kelamin</span><span class="cd-review-value">${genderMap[data.child_gender] || '-'}</span></div>
    </div>
    <div class="cd-review-section">
      <div class="cd-review-title">👶 Data Kelahiran</div>
      <div class="cd-review-item"><span class="cd-review-label">Berat Lahir</span><span class="cd-review-value">${data.birth_weight ? data.birth_weight + ' kg' : '-'}</span></div>
      <div class="cd-review-item"><span class="cd-review-label">Panjang Lahir</span><span class="cd-review-value">${data.birth_height ? data.birth_height + ' cm' : '-'}</span></div>
      <div class="cd-review-item"><span class="cd-review-label">Lingkar Kepala</span><span class="cd-review-value">${data.birth_head_circumference ? data.birth_head_circumference + ' cm' : '-'}</span></div>
    </div>
    <div class="cd-review-section">
      <div class="cd-review-title">👨‍👩‍👦 Orang Tua</div>
      <div class="cd-review-item"><span class="cd-review-label">Nama Ayah</span><span class="cd-review-value">${escapeHtml(data.father_name) || '-'}</span></div>
      <div class="cd-review-item"><span class="cd-review-label">Nama Ibu</span><span class="cd-review-value">${escapeHtml(data.mother_name) || '-'}</span></div>
      <div class="cd-review-item"><span class="cd-review-label">Catatan</span><span class="cd-review-value">${escapeHtml(data.parent_notes) || '-'}</span></div>
    </div>
  `;
  
  document.getElementById('cd-review-content').innerHTML = html;
}

function collectFormData() {
  return {
    child_name: document.getElementById('cd-fullname').value.trim(),
    child_nickname: document.getElementById('cd-nickname').value.trim(),
    child_dob: document.getElementById('cd-dob').value,
    child_gender: document.getElementById('cd-gender').value,
    birth_weight: document.getElementById('cd-birth-weight').value || null,
    birth_height: document.getElementById('cd-birth-height').value || null,
    birth_head_circumference: document.getElementById('cd-birth-head').value || null,
    father_name: document.getElementById('cd-father-name').value.trim(),
    mother_name: document.getElementById('cd-mother-name').value.trim(),
    parent_notes: document.getElementById('cd-parent-notes').value.trim(),
  };
}

async function submitChildData() {
  const data = collectFormData();
  
  if (!data.child_name) {
    showToast('Nama anak wajib diisi', 'error');
    showStep(1);
    return;
  }

  try {
    await Api.updateChildProfile(data);
    showToast('Data anak berhasil disimpan ✅', 'success');
    closeChildForm();
    await loadChildDataPage();
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan data', 'error');
  }
}

// Event listeners for child data page (called from initApp)
function initChildDataListeners() {
  // Back button
  safeAddListener('btn-back-child-data', 'click', () => navigate('home'));
  
  // Edit / Add buttons
  safeAddListener('btn-edit-child', 'click', openChildForm);
  safeAddListener('btn-add-child-data', 'click', openChildForm);
  
  // Modal controls
  safeAddListener('cd-close-modal', 'click', closeChildForm);
  safeAddListener('cd-prev-step', 'click', prevStep);
  safeAddListener('cd-next-step', 'click', nextStep);

  // Close modal on overlay click
  safeAddListener('child-form-modal', 'click', (e) => {
    if (e.target === e.currentTarget) closeChildForm();
  });
}

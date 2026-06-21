// ============================
// MULTI-STEP FORM WIZARD (Data Anak)
// ============================
let cdCurrentStep = 1;
let cdData = {};
let cdSelectedAvatar = '';
let cdAvatarPicker = null;

function selectAvatar(el) {
  // Legacy — no longer used by new picker
  // Kept for backward compat
}

function openChildForm() {
  cdCurrentStep = 1;
  cdSelectedAvatar = cdData.photo || '';

  // Pre-fill form with existing data from cdData (loaded via settings)
  document.getElementById('cd-fullname').value = cdData.name || '';
  document.getElementById('cd-nickname').value = cdData.nickname || '';
  // Format DOB: ambil YYYY-MM-DD aja dari ISO string
  const dobVal = cdData.dob ? cdData.dob.split('T')[0] : '';
  document.getElementById('cd-dob').value = dobVal;
  document.getElementById('cd-gender').value = cdData.gender || '';
  document.getElementById('cd-birth-weight').value = cdData.birth_weight || '';
  document.getElementById('cd-birth-height').value = cdData.birth_height || '';
  document.getElementById('cd-birth-head').value = cdData.birth_head_circumference || '';
  document.getElementById('cd-father-name').value = cdData.father_name || '';
  document.getElementById('cd-mother-name').value = cdData.mother_name || '';
  document.getElementById('cd-parent-notes').value = cdData.parent_notes || '';

  // Pre-select avatar
  if (cdSelectedAvatar) {
    const opts = document.querySelectorAll('.avatar-opt');
    opts.forEach(o => {
      if (o.dataset.avatar === cdSelectedAvatar) {
        o.style.borderColor = '#E8682E';
        o.style.background = '#FFF0E8';
      } else {
        o.style.borderColor = 'transparent';
        o.style.background = '#f5f5f5';
      }
    });
    document.getElementById('cd-avatar').value = cdSelectedAvatar;
  } else {
    document.getElementById('cd-avatar').value = '';
  }

  // Init avatar picker
  const pickerContainer = document.getElementById('avatar-picker-container');
  if (pickerContainer) {
    cdAvatarPicker = avatarPickerBuilder(pickerContainer, cdSelectedAvatar || 'warm-peach', (cfg) => {
      cdSelectedAvatar = avatarEncode(cfg);
      document.getElementById('cd-avatar').value = cdSelectedAvatar;
    });
    // If existing avatar data, set initial encoded value
    if (cdSelectedAvatar) {
      const parsed = avatarParse(cdSelectedAvatar);
      if (!parsed._isEmoji) {
        cdSelectedAvatar = avatarEncode(parsed);
        document.getElementById('cd-avatar').value = cdSelectedAvatar;
      } else {
        // Legacy emoji — will show as emoji text fallback
        document.getElementById('cd-avatar').value = cdSelectedAvatar;
      }
    }
  }

  showStep(1);
  document.getElementById('child-form-modal').classList.remove('hidden');
}

function closeChildForm() {
  document.getElementById('child-form-modal').classList.add('hidden');
}

function showStep(step) {
  cdCurrentStep = step;

  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`cd-step-${i}`);
    if (el) {
      el.style.display = '';
      if (i === step) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  }

  const titles = ['Data Dasar', 'Data Kelahiran', 'Informasi Orang Tua', 'Konfirmasi Data'];
  document.getElementById('child-form-title').textContent = titles[step - 1];

  // Step dots
  document.querySelectorAll('.cd-step-dot').forEach((dot, i) => {
    const idx = i + 1;
    dot.classList.remove('active', 'done');
    if (idx === step) { dot.classList.add('active'); dot.style.background = '#E8682E'; }
    else if (idx < step) { dot.classList.add('done'); dot.style.background = '#E8682E'; }
    else { dot.style.background = '#ddd'; }
  });

  const prevBtn = document.getElementById('cd-prev-step');
  const nextBtn = document.getElementById('cd-next-step');
  prevBtn.style.display = step === 1 ? 'none' : 'block';
  nextBtn.textContent = step === 4 ? '✅ Simpan Data' : 'Lanjut →';
  nextBtn.style.display = 'block';

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

  const html = `
    <div class="cd-review-section">
      <div class="cd-review-title">📋 Data Dasar</div>
      <div class="cd-review-item"><span class="cd-review-label">Avatar</span><span class="cd-review-value" style="display:flex;justify-content:center;">${data.child_photo ? avatarGenerateSVG(data.child_photo, 56) : '❌'}</span></div>
      <div class="cd-review-item"><span class="cd-review-label">Nama Lengkap</span><span class="cd-review-value">${escapeHtml(data.child_name) || '-'}</span></div>
      <div class="cd-review-item"><span class="cd-review-label">Nama Panggilan</span><span class="cd-review-value">${escapeHtml(data.child_nickname) || '-'}</span></div>
      <div class="cd-review-item"><span class="cd-review-label">Tanggal Lahir</span><span class="cd-review-value">${data.child_dob || '-'}</span></div>
      <div class="cd-review-item"><span class="cd-review-label">Jenis Kelamin</span><span class="cd-review-value">${data.child_gender || '-'}</span></div>
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
    child_dob: document.getElementById('cd-dob').value || null,
    child_gender: document.getElementById('cd-gender').value,
    child_photo: document.getElementById('cd-avatar').value || '',
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
    // Refresh settings page data
    if (typeof loadChildProfileSettings === 'function') {
      cdData = (await Api.getChildProfile()).child || {};
      loadChildProfileSettings();
    }
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan data', 'error');
  }
}

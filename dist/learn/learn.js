(function () {
  'use strict';

  const course = window.KIDYCODE_COURSE;
  if (!course) return;

  const storageKey = 'kidycode-code-explorers-v1';
  const defaultState = {
    profile: null,
    completed: {},
    checked: {},
    explanations: {},
    debugNotes: {},
    codes: {},
    requirements: {},
    hintUse: {},
    snapshots: [],
    activity: [],
    lastLesson: null,
    recommendedStage: 1,
    lowData: false
  };

  let state = loadState();
  let currentLesson = null;
  let hintIndex = 0;
  let ranCurrent = false;

  const allLessons = course.stages.flatMap((stage) => stage.lessons);
  const byId = Object.fromEntries(allLessons.map((lesson) => [lesson.id, lesson]));
  const stageById = Object.fromEntries(course.stages.map((stage) => [stage.id, stage]));

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      return { ...defaultState, ...saved };
    } catch (_) {
      return { ...defaultState };
    }
  }

  function saveState(message) {
    localStorage.setItem(storageKey, JSON.stringify(state));
    const saveLabel = $('#save-state');
    if (saveLabel && message) {
      saveLabel.textContent = message;
      window.setTimeout(() => { saveLabel.textContent = 'Saved on this device'; }, 1400);
    }
  }

  function addActivity(text, lessonId) {
    state.activity.unshift({ text, lessonId, at: new Date().toISOString() });
    state.activity = state.activity.slice(0, 30);
  }

  function mentorAsset(key) {
    if (key === 'elephant') return '../assets/origami-elephant.webp';
    if (key === 'owl' || key === 'butterfly') return '../assets/origami-bird.webp';
    return '../assets/origami-fox.webp';
  }

  function stageProgress(stage) {
    const done = stage.lessons.filter((lesson) => state.completed[lesson.id]).length;
    return { done, total: stage.lessons.length, percent: Math.round((done / stage.lessons.length) * 100) };
  }

  function stageMastery(stage) {
    const project = stage.lessons.find((lesson) => lesson.kind === 'Boss project');
    const checkedCount = stage.lessons.filter((lesson) => state.checked[lesson.id]).length;
    const explainedCount = stage.lessons.filter((lesson) => (state.explanations[lesson.id] || '').trim().length >= 15).length;
    return {
      understand: checkedCount >= Math.max(1, stage.lessons.length - (project ? 1 : 0)),
      build: project ? Boolean(state.completed[project.id]) : stage.lessons.every((lesson) => state.completed[lesson.id]),
      explain: project ? (state.explanations[project.id] || '').trim().length >= 15 && Boolean(state.completed[project.id]) : explainedCount >= stage.lessons.length
    };
  }

  function stageIsMastered(stage) {
    const stars = stageMastery(stage);
    return stars.understand && stars.build && stars.explain;
  }

  function isStageUnlocked(stage) {
    if (stage.number <= Math.max(1, Number(state.recommendedStage) || 1)) return true;
    const previous = course.stages[stage.number - 2];
    return previous ? stageIsMastered(previous) : true;
  }

  function isLessonUnlocked(stage, index) {
    if (!isStageUnlocked(stage)) return false;
    if (index === 0) return true;
    if (stage.number <= state.recommendedStage && index === 0) return true;
    return Boolean(state.completed[stage.lessons[index - 1].id]);
  }

  function totalProgress() {
    const complete = allLessons.filter((lesson) => state.completed[lesson.id]).length;
    return { complete, total: allLessons.length, percent: Math.round((complete / allLessons.length) * 100) };
  }

  function renderProgress() {
    const progress = totalProgress();
    $('#progress-label').textContent = `${progress.complete} of ${progress.total} activities`;
    $('#progress-bar').style.width = `${progress.percent}%`;
    $('#learner-chip').textContent = state.profile ? state.profile.name : 'New explorer';
    $('#welcome-copy').textContent = state.profile
      ? `${state.profile.name}, your map remembers each test, fix and finished build on this device.`
      : 'Small lessons. Real projects. Your work stays on this device while you learn.';
  }

  function nextLesson() {
    if (state.lastLesson && byId[state.lastLesson] && !state.completed[state.lastLesson]) return byId[state.lastLesson];
    for (const stage of course.stages) {
      if (!isStageUnlocked(stage)) continue;
      for (let index = 0; index < stage.lessons.length; index += 1) {
        const lesson = stage.lessons[index];
        if (!state.completed[lesson.id] && isLessonUnlocked(stage, index)) return lesson;
      }
    }
    return allLessons[allLessons.length - 1];
  }

  function renderNextCard() {
    const lesson = nextLesson();
    const stage = stageById[lesson.stageId];
    $('#next-card').innerHTML = `
      <div><span>NEXT UP · STAGE ${stage.number}</span><b>${escapeHtml(lesson.title)}</b><p>${escapeHtml(lesson.task)}</p></div>
      <button class="button button-primary" data-lesson="${lesson.id}" type="button">Continue ${lesson.time} min</button>`;
  }

  function renderStageMap() {
    $('#stage-map').innerHTML = course.stages.map((stage) => {
      const progress = stageProgress(stage);
      const stars = stageMastery(stage);
      const unlocked = isStageUnlocked(stage);
      const nextIndex = stage.lessons.findIndex((lesson, index) => !state.completed[lesson.id] && isLessonUnlocked(stage, index));
      const next = nextIndex >= 0 ? stage.lessons[nextIndex] : stage.lessons[0];
      const status = stageIsMastered(stage) ? 'Mastered' : !unlocked ? 'Locked' : progress.done ? 'In progress' : stage.number < state.recommendedStage ? 'Review when ready' : 'Ready';
      return `
        <article class="stage-card ${unlocked ? '' : 'is-locked'} ${stageIsMastered(stage) ? 'is-mastered' : ''}">
          <div class="stage-number">${String(stage.number).padStart(2, '0')}</div>
          <div class="stage-main">
            <div class="stage-status"><span>${status}</span><span>${progress.done}/${progress.total} complete</span></div>
            <h2>${escapeHtml(stage.title)}</h2>
            <p>${escapeHtml(stage.short)}</p>
            <div class="stage-make"><b>YOU MAKE</b><span>${escapeHtml(stage.make)}</span></div>
            <div class="lesson-dots" aria-label="${progress.done} of ${progress.total} activities completed">
              ${stage.lessons.map((lesson, index) => `<i class="${state.completed[lesson.id] ? 'is-done' : isLessonUnlocked(stage, index) ? 'is-open' : ''}" title="${escapeHtml(lesson.title)}"></i>`).join('')}
            </div>
          </div>
          <div class="stage-side">
            <div class="stage-mentor ${stage.mentorKey}"><img src="${mentorAsset(stage.mentorKey)}" alt="${escapeHtml(stage.mentor)} origami guide" /></div>
            <div class="star-row" aria-label="Mastery stars">
              <span class="${stars.understand ? 'earned' : ''}" title="Understand">★</span>
              <span class="${stars.build ? 'earned' : ''}" title="Build">★</span>
              <span class="${stars.explain ? 'earned' : ''}" title="Explain">★</span>
            </div>
            ${unlocked ? `<button class="stage-open" data-lesson="${next.id}" type="button">${progress.done ? 'Continue stage' : 'Open stage'} <span>→</span></button>` : '<span class="locked-note">Master the stage above to open this one.</span>'}
          </div>
        </article>`;
    }).join('');
  }

  function renderStudio() {
    const projects = allLessons.filter((lesson) => lesson.kind === 'Boss project');
    $('#studio-projects').innerHTML = projects.map((project) => {
      const stage = stageById[project.stageId];
      const open = isStageUnlocked(stage);
      return `<article class="studio-project ${open ? '' : 'is-locked'}"><div><span>STAGE ${stage.number}</span><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.goal)}</p></div>${open ? `<button data-lesson="${project.id}" type="button">Open brief</button>` : '<b>Locked</b>'}</article>`;
    }).join('');

    const snapshots = state.snapshots || [];
    $('#snapshot-list').innerHTML = snapshots.length ? snapshots.map((snapshot, index) => {
      const lesson = byId[snapshot.lessonId];
      return `<article class="snapshot"><div><b>${escapeHtml(lesson ? lesson.title : 'Saved build')}</b><span>${new Date(snapshot.at).toLocaleString()}</span></div><button data-restore="${index}" type="button">Restore</button></article>`;
    }).join('') : 'No versions saved yet. Save one inside any activity.';
  }

  function renderPortfolio() {
    const projects = allLessons.filter((lesson) => lesson.kind === 'Boss project' && state.completed[lesson.id]);
    $('#portfolio-grid').innerHTML = projects.length ? projects.map((project) => {
      const stage = stageById[project.stageId];
      return `<article class="portfolio-card"><span>STAGE ${stage.number} BUILD</span><h2>${escapeHtml(project.title)}</h2><p>${escapeHtml(project.goal)}</p><div><b>Evidence saved</b><span>Working build · explanation · test note</span></div><button data-lesson="${project.id}" type="button">Open my build</button></article>`;
    }).join('') : '<div class="large-empty"><b>Your first build will land here.</b><p>Finish the Stage 1 boss project to add it to your private collection.</p></div>';
  }

  function earnedBadges() {
    const earned = new Set();
    course.stages.forEach((stage) => {
      if (stageIsMastered(stage)) earned.add(stage.badge);
    });
    const explained = Object.values(state.explanations).filter((text) => String(text).trim().length >= 15).length;
    if (explained >= 5) earned.add('Helpful Explainer');
    if ((state.snapshots || []).length >= 10) earned.add('Brave Tester');
    return earned;
  }

  function renderBadges() {
    const earned = earnedBadges();
    $('#badge-grid').innerHTML = course.badges.map(([name, evidence]) => `<article class="badge-card ${earned.has(name) ? 'is-earned' : ''}"><span aria-hidden="true">${earned.has(name) ? '◆' : '◇'}</span><div><h2>${escapeHtml(name)}</h2><p>${escapeHtml(evidence)}</p><b>${earned.has(name) ? 'Earned with evidence' : 'Still to discover'}</b></div></article>`).join('');
    const graduate = stageIsMastered(course.stages[course.stages.length - 1]);
    const learnerName = state.profile ? escapeHtml(state.profile.name) : 'Code Explorer';
    $('#certificate-card').innerHTML = `<div><span>KIDYCODE CREATIVE CODING FOUNDATIONS</span><h2>${graduate ? `${learnerName} built, tested and explained an original project.` : 'Your certificate is built from evidence.'}</h2><p>${graduate ? 'All thirteen stages are mastered. This certificate records completed work, not time spent on a page.' : 'Master all thirteen stages to prepare the printable certificate.'}</p></div><button class="button ${graduate ? 'button-primary' : 'button-quiet'}" data-print-certificate type="button" ${graduate ? '' : 'disabled'}>Print certificate</button>`;
  }

  function renderGrownup() {
    const progress = totalProgress();
    $('#grownup-progress').textContent = `${progress.percent}%`;
    $('#grownup-summary').textContent = `${progress.complete} of ${progress.total} activities complete. ${earnedBadges().size} evidence badges earned.`;
    $('#low-data-toggle').checked = Boolean(state.lowData);
    const recent = (state.activity || []).slice(0, 6);
    $('#recent-effort').innerHTML = recent.length ? recent.map((item) => `<article class="effort-item"><span>${new Date(item.at).toLocaleDateString()}</span><p>${escapeHtml(item.text)}</p></article>`).join('') : 'Learning activity will appear here after the first check or saved version.';
  }

  function renderAll() {
    renderProgress();
    renderNextCard();
    renderStageMap();
    renderStudio();
    renderPortfolio();
    renderBadges();
    renderGrownup();
    bindDynamicButtons();
  }

  function bindDynamicButtons() {
    $$('[data-lesson]').forEach((button) => {
      button.onclick = () => openLesson(button.dataset.lesson);
    });
    $$('[data-restore]').forEach((button) => {
      button.onclick = () => restoreSnapshot(Number(button.dataset.restore));
    });
    $$('[data-print-certificate]').forEach((button) => {
      button.onclick = () => window.print();
    });
  }

  function switchView(name) {
    $$('.app-view').forEach((view) => view.classList.toggle('is-active', view.id === `${name}-view`));
    $$('.nav-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.view === name));
    if (name !== 'lesson') currentLesson = null;
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function openLesson(id) {
    const lesson = byId[id];
    if (!lesson) return;
    const stage = stageById[lesson.stageId];
    const index = stage.lessons.findIndex((item) => item.id === id);
    if (!isLessonUnlocked(stage, index)) return;

    currentLesson = lesson;
    hintIndex = 0;
    ranCurrent = false;
    state.lastLesson = id;
    saveState();

    $('#lesson-stage').textContent = `STAGE ${stage.number} · ${stage.title.toUpperCase()}`;
    $('#lesson-time').textContent = `${lesson.time} MIN`;
    $('#lesson-kind').textContent = lesson.kind.toUpperCase();
    $('#lesson-title').textContent = lesson.title;
    $('#lesson-goal').textContent = lesson.goal;
    $('#lesson-concept').innerHTML = `<p>${escapeHtml(lesson.concept)}</p>`;
    $('#lesson-predict').textContent = lesson.predict;
    $('#lesson-task').textContent = lesson.task;
    $('#mentor-message').innerHTML = `<img src="${mentorAsset(stage.mentorKey)}" alt="" /><div><b>${escapeHtml(stage.mentor)}</b><p>${escapeHtml(stage.mentorLine)}</p></div>`;
    $('#code-editor').value = state.codes[id] ?? lesson.starter;
    $('#explain-box').value = state.explanations[id] || '';
    $('#debug-box').value = state.debugNotes[id] || '';
    $('#hint-count').textContent = 'Hint 1 of 3';
    $('#hint-text').textContent = lesson.hints[0];
    $('#next-hint').textContent = 'Show the next hint';
    $('#next-hint').disabled = false;
    $('#feedback-box').className = 'feedback-box';
    $('#feedback-box').textContent = state.checked[id] ? 'Your last check passed. Run it again after any new change.' : 'Try the task. A mistake is information, not a score.';
    $('#complete-lesson').disabled = !(state.checked[id] && (state.explanations[id] || '').trim().length >= 15);
    $('#complete-lesson').textContent = state.completed[id] ? 'Activity complete' : 'Finish activity';
    $('#mastery-label').textContent = lesson.kind === 'Boss project' ? 'Boss project mastery' : 'Mastery check';
    const requirementBox = $('#project-requirements');
    if (lesson.requirements) {
      requirementBox.hidden = false;
      requirementBox.innerHTML = `<b>PROJECT CHECKLIST</b>${lesson.requirements.map((requirement, requirementIndex) => `<label><input type="checkbox" data-requirement="${requirementIndex}" ${state.requirements[lesson.id]?.[requirementIndex] ? 'checked' : ''} /> <span>${escapeHtml(requirement)}</span></label>`).join('')}`;
      $$('[data-requirement]', requirementBox).forEach((input) => input.addEventListener('change', () => {
        state.requirements[lesson.id] = state.requirements[lesson.id] || {};
        state.requirements[lesson.id][input.dataset.requirement] = input.checked;
        saveState('Checklist saved');
      }));
    } else {
      requirementBox.hidden = true;
      requirementBox.innerHTML = '';
    }
    runCode(false);
    activateWorkTab('practice');
    switchView('lesson');
  }

  function runCode(announce = true) {
    if (!currentLesson) return;
    const code = $('#code-editor').value;
    state.codes[currentLesson.id] = code;
    saveState(announce ? 'Code saved' : null);
    if (announce) ranCurrent = true;

    if (currentLesson.mode === 'html' || currentLesson.mode === 'javascript') {
      $('#code-preview').hidden = false;
      $('#text-output').hidden = true;
      $('#code-preview').srcdoc = code;
    } else {
      $('#code-preview').hidden = true;
      $('#text-output').hidden = false;
      const lines = code.split('\n').filter((line) => line.trim()).slice(0, 12);
      $('#text-output').innerHTML = `<div class="sim-world"><span class="sim-start">START</span><i class="sim-path"></i><span class="sim-maker">◆</span><span class="sim-finish">RESULT</span></div><ol>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ol>`;
    }
    activateWorkTab('preview');
  }

  function checkWork() {
    if (!currentLesson) return;
    const code = $('#code-editor').value.trim();
    const changed = code !== currentLesson.starter.trim();
    const longEnough = code.length >= currentLesson.minChars;
    const signalFound = !currentLesson.signals.length || currentLesson.signals.some((signal) => code.toLowerCase().includes(signal.toLowerCase()));
    const requirementsReady = !currentLesson.requirements || currentLesson.requirements.every((_, index) => state.requirements[currentLesson.id]?.[index]);
    const feedback = $('#feedback-box');

    if (!ranCurrent) {
      feedback.className = 'feedback-box needs-work';
      feedback.textContent = 'Run your work first. A test gives you evidence before you decide it is finished.';
      return;
    }
    if (!changed) {
      feedback.className = 'feedback-box needs-work';
      feedback.textContent = 'The starter still looks unchanged. Make one choice of your own, then run it again.';
      return;
    }
    if (!longEnough || !signalFound) {
      feedback.className = 'feedback-box needs-work';
      feedback.textContent = `Your work runs, but the ${currentLesson.focus.toLowerCase()} is not clear yet. Read the task and add the missing step.`;
      return;
    }
    if (!requirementsReady) {
      feedback.className = 'feedback-box needs-work';
      feedback.textContent = 'Your build runs. Test every item in the project checklist and tick it only after you see it work.';
      return;
    }

    state.checked[currentLesson.id] = true;
    state.codes[currentLesson.id] = code;
    addActivity(`Passed the check for ${currentLesson.title}.`, currentLesson.id);
    saveState('Check passed');
    feedback.className = 'feedback-box is-good';
    feedback.textContent = `It works for this check. Now explain one choice so the result becomes evidence of your thinking.`;
    updateFinishState();
    renderProgress();
  }

  function saveThinking() {
    if (!currentLesson) return;
    state.explanations[currentLesson.id] = $('#explain-box').value.trim();
    state.debugNotes[currentLesson.id] = $('#debug-box').value.trim();
    if (state.explanations[currentLesson.id].length < 15) {
      $('#feedback-box').className = 'feedback-box needs-work';
      $('#feedback-box').textContent = 'Add one more detail. Name a command and say what it changes.';
    } else {
      addActivity(`Explained how ${currentLesson.title} works.`, currentLesson.id);
      $('#feedback-box').className = 'feedback-box is-good';
      $('#feedback-box').textContent = 'Thinking saved. Your explanation can be short, but it must sound like you.';
    }
    saveState('Thinking saved');
    updateFinishState();
    renderProgress();
  }

  function updateFinishState() {
    if (!currentLesson) return;
    const ready = Boolean(state.checked[currentLesson.id]) && (state.explanations[currentLesson.id] || '').trim().length >= 15;
    $('#complete-lesson').disabled = !ready;
  }

  function completeLesson() {
    if (!currentLesson || $('#complete-lesson').disabled) return;
    state.completed[currentLesson.id] = true;
    addActivity(`Completed ${currentLesson.title}.`, currentLesson.id);
    saveState('Activity complete');
    const stage = stageById[currentLesson.stageId];
    const nextIndex = stage.lessons.findIndex((lesson) => lesson.id === currentLesson.id) + 1;
    const next = stage.lessons[nextIndex];
    $('#feedback-box').className = 'feedback-box is-good';
    $('#feedback-box').textContent = next ? `Activity complete. ${next.title} is now open.` : `${stage.title} is complete. Check your mastery stars on the map.`;
    $('#complete-lesson').textContent = 'Activity complete';
    renderAll();
    window.setTimeout(() => switchView('map'), 900);
  }

  function saveSnapshot() {
    if (!currentLesson) return;
    const snapshot = { lessonId: currentLesson.id, code: $('#code-editor').value, at: new Date().toISOString() };
    state.snapshots.unshift(snapshot);
    state.snapshots = state.snapshots.slice(0, 40);
    addActivity(`Saved a version of ${currentLesson.title}.`, currentLesson.id);
    saveState('Version saved');
    $('#feedback-box').className = 'feedback-box is-good';
    $('#feedback-box').textContent = 'Version saved. You can experiment and return to this point from Studio.';
    renderStudio();
    bindDynamicButtons();
  }

  function restoreSnapshot(index) {
    const snapshot = state.snapshots[index];
    if (!snapshot || !byId[snapshot.lessonId]) return;
    state.codes[snapshot.lessonId] = snapshot.code;
    saveState();
    openLesson(snapshot.lessonId);
    $('#feedback-box').className = 'feedback-box is-good';
    $('#feedback-box').textContent = 'Saved version restored. Run it before making another change.';
  }

  function activateWorkTab(name) {
    $$('.work-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.workTab === name));
    $$('.work-panel').forEach((panel) => panel.classList.toggle('is-active', panel.id === `${name}-panel`));
  }

  $$('.nav-tab').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
  $$('[data-view]').filter((button) => !button.classList.contains('nav-tab')).forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
  $$('.work-tab').forEach((button) => button.addEventListener('click', () => activateWorkTab(button.dataset.workTab)));
  $('#run-code').addEventListener('click', () => runCode(true));
  $('#check-work').addEventListener('click', checkWork);
  $('#save-thinking').addEventListener('click', saveThinking);
  $('#save-snapshot').addEventListener('click', saveSnapshot);
  $('#complete-lesson').addEventListener('click', completeLesson);
  $('#low-data-toggle').addEventListener('change', (event) => {
    state.lowData = event.currentTarget.checked;
    applyPreferences();
    saveState('Comfort setting saved');
  });
  $('#code-editor').addEventListener('input', () => {
    if (!currentLesson) return;
    state.codes[currentLesson.id] = $('#code-editor').value;
    window.clearTimeout(window.kidyCodeSaveTimer);
    window.kidyCodeSaveTimer = window.setTimeout(() => saveState('Draft saved'), 450);
  });
  $('#next-hint').addEventListener('click', () => {
    if (!currentLesson) return;
    hintIndex = Math.min(2, hintIndex + 1);
    state.hintUse[currentLesson.id] = Math.max(state.hintUse[currentLesson.id] || 0, hintIndex + 1);
    $('#hint-count').textContent = `Hint ${hintIndex + 1} of 3`;
    $('#hint-text').textContent = currentLesson.hints[hintIndex];
    $('#next-hint').textContent = hintIndex === 2 ? 'All hints shown' : 'Show the next hint';
    $('#next-hint').disabled = hintIndex === 2;
    saveState();
  });

  const profileDialog = $('#profile-dialog');
  $('#learner-chip').addEventListener('click', () => profileDialog.showModal());
  $('#profile-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const experience = data.get('experience');
    state.profile = { name: String(data.get('learnerName')).trim().slice(0, 20), age: data.get('age'), experience };
    state.recommendedStage = experience === 'projects' ? 7 : experience === 'blocks' ? 3 : 1;
    addActivity(`Created a Code Explorers map with Stage ${state.recommendedStage} recommended.`, null);
    saveState();
    profileDialog.close();
    renderAll();
  });

  $$('[data-open-weekly]').forEach((button) => button.addEventListener('click', () => $('#weekly-dialog').showModal()));
  $$('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));

  function applyPreferences() {
    document.body.classList.toggle('low-data', Boolean(state.lowData));
  }

  applyPreferences();
  renderAll();
  if (!state.profile) profileDialog.showModal();
})();

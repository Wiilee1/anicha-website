// Od-Nowa Retreat — Interactive Scripts

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('mobile-active');
        });
    }

    // 2. Schedule Tabs Functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Show corresponding tab content
            const dayId = btn.getAttribute('data-day');
            const targetContent = document.getElementById(dayId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // 3. Business Pitch Panel Toggle (Presentation Mode for Owners/Family)
    const pitchPanel = document.getElementById('pitchPanel');
    const togglePitchBtn = document.getElementById('togglePitchBtn');
    const btnShowPitchFull = document.getElementById('btnShowPitchFull');

    function togglePitch() {
        if (pitchPanel.style.display === 'none' || pitchPanel.style.display === '') {
            pitchPanel.style.display = 'block';
            togglePitchBtn.textContent = 'Ukryj Tryb Biznesowy';
            togglePitchBtn.style.background = '#C86D51';
            togglePitchBtn.style.color = '#FFFFFF';
            pitchPanel.scrollIntoView({ behavior: 'smooth' });
        } else {
            pitchPanel.style.display = 'none';
            togglePitchBtn.textContent = 'Włącz Tryb Biznesowy';
            togglePitchBtn.style.background = '#D4A373';
            togglePitchBtn.style.color = '#1E3E2B';
        }
    }

    if (togglePitchBtn) {
        togglePitchBtn.addEventListener('click', togglePitch);
    }

    // 4. Full Master Schedule Drawer Toggle
    const toggleFullScheduleBtn = document.getElementById('toggleFullScheduleBtn');
    const fullScheduleDrawer = document.getElementById('fullScheduleDrawer');

    if (toggleFullScheduleBtn && fullScheduleDrawer) {
        toggleFullScheduleBtn.addEventListener('click', () => {
            if (fullScheduleDrawer.style.display === 'none' || fullScheduleDrawer.style.display === '') {
                fullScheduleDrawer.style.display = 'block';
                toggleFullScheduleBtn.textContent = '▲ Ukryj Szczegółowy Harmonogram';
                fullScheduleDrawer.scrollIntoView({ behavior: 'smooth' });
            } else {
                fullScheduleDrawer.style.display = 'none';
                toggleFullScheduleBtn.textContent = '📋 Rozwiń Pełny Harmonogram ze Szczegółami Prowadzących';
            }
        });
    }

    if (btnShowPitchFull) {
        btnShowPitchFull.addEventListener('click', () => {
            if (pitchPanel.style.display === 'none' || pitchPanel.style.display === '') {
                togglePitch();
            } else {
                pitchPanel.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // 4. Smooth Navigation & Auto Close Mobile Menu
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');

            // Close mobile menu if open
            if (navMenu && navMenu.classList.contains('mobile-active')) {
                navMenu.classList.remove('mobile-active');
            }

            if (targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

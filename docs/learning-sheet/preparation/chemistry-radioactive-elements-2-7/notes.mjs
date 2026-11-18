const asset = 'assets/2-7-radioactive/';
const ipst = 'https://www.scimath.org/ebook-chemistry/item/13172-e-book';
const aksorn = 'https://drive.google.com/file/d/1282BmRDHm1gQPUxS3g-Zqa09IwrrkPL4/view';
const mytcas68 = 'https://assets.mytcas.com/68/answer/tcas68-chem-a-level.pdf';
const mytcas69 = 'https://assets.mytcas.com/69/answer/tcas69-chem-a-level.pdf';

export function isotope(a, z, x) {
  return `<span class="isotope"><span class="isotope-index"><sup>${a}</sup><sub>${z}</sub></span>${x}</span>`;
}

export const line = text => `<p class="math-line">${text}</p>`;
export const para = text => `<p>${text}</p>`;
const heading = text => `<h3>${text}</h3>`;
const n = isotope;
const na = n(24,11,'Na'), mg = n(24,12,'Mg'), alpha = n(4,2,'He'), beta = n(0,'−1','e'), positron = n(0,'+1','e');
const equation = (id, math) => `<div class="equation"><span>${math}</span><b>(${id})</b></div>`;
const table = (headers, rows) => `<table><thead><tr>${headers.map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

export function noteCheck(prompt, answer, size = 15) {
  return `<div class="note-task">${para(prompt)}<div class="note-answer" data-write-mm="${size}">${answer}</div></div>`;
}

export function figure(file, width, height, alt, caption, url, label, className = '') {
  return `<figure class="${className}"><img src="${asset + file}" width="${width}" height="${height}" alt="${alt}"><figcaption>${caption} <a href="${url}">${label}</a></figcaption></figure>`;
}

export function graphs(en) {
  return figure('aksorn-half-life-graph.png',489,282,en?'Decreasing mass at equal half-life intervals':'กราฟมวลที่เหลือลดลงทุกช่วงครึ่งชีวิต',
    en?'Vertical axis: mass remaining relative to initial mass. Horizontal axis: elapsed time.':'แกนตั้งคือมวลที่เหลือเทียบกับมวลเริ่มต้น แกนนอนคือเวลาที่ผ่านไป',
    aksorn,en?'Aksorn, PDF p. 160':'อจท. หน้า PDF 160','graph');
}

export function model(en) {
  const hours = [0,15,30];
  return `<figure><div class="stages">${hours.map(h=>`<div><b>${h} ${en?'h':'ชั่วโมง'}</b><img src="${asset}ipst-na-mg-${h}h.svg" width="246" height="246" alt="${en?'Na-24 and Mg-24 model':'แบบจำลอง Na-24 กับ Mg-24'} · ${h} h"></div>`).join('')}</div>
  <figcaption>${en?'Purple: Na-24. Teal: Mg-24. Each panel shows a model of relative amounts.':'สีม่วงแทน Na-24 สีฟ้าอมเขียวแทน Mg-24 แต่ละช่องเป็นแบบจำลองสัดส่วนของไอโซโทป'} <a href="${ipst}">${en?'IPST e-book, Half-life':'อีบุ๊ก สสวท. เรื่องครึ่งชีวิต'}</a></figcaption></figure>`;
}

function worked(en, index, title, question, answer, height = 29) {
  return `<section class="worked">${heading(`${en?'Guided example':'ตัวอย่างพาทำ'} ${index} · ${title}`)}${noteCheck(question,answer,height)}</section>`;
}

export function notes(lang) {
  const en = lang === 'en';
  const t = (th, eng) => en ? eng : th;
  const p = (th, eng) => para(t(th,eng));
  const h = (th, eng) => heading(t(th,eng));
  const aeq = '∑ A<sub>left</sub> = ∑ A<sub>right</sub>';
  const zeq = '∑ Z<sub>left</sub> = ∑ Z<sub>right</sub>';
  const half = 'n = t/T<sub>½</sub>';
  const fraction = 'f = m<sub>t</sub>/m<sub>0</sub> = (½)<sup>n</sup>';
  const decayed = 'm<sub>decay</sub> = m<sub>0</sub> − m<sub>t</sub>';
  const use = ids => p(`<strong>ใช้สมการ ${ids}</strong>`,`<strong>Use equation${ids.includes('–')?'s':''} ${ids}</strong>`);
  const sections = [
    ['isotopes', t('1. ธาตุเดียวกัน ทำไมบางไอโซโทปสลายตัว','1. Why do some isotopes of an element decay?'), `
      ${p('ในแบบจำลองเริ่มต้นมี Na-24 ทั้งหมด เมื่อเวลาผ่านไป Na-24 เหลือครึ่งหนึ่ง นิวเคลียสส่วนที่สลายไปกลายเป็นอะไร?',
      'The model starts with only Na-24. Later, half of the Na-24 remains. What did the nuclei that decayed become?')}
      ${model(en)}
      ${noteCheck(t('สังเกตที่ 0 และ 15 ชั่วโมง นิวเคลียสชนิดใดลดลง และชนิดใดเพิ่มขึ้น?', 'Compare 0 and 15 h. Which nuclei decrease and which increase?'),
        p('Na-24 ลดลง ส่วน Mg-24 เพิ่มขึ้น เพราะนิวเคลียสแม่เปลี่ยนเป็นนิวเคลียสลูก','Na-24 decreases and Mg-24 increases. A parent nucleus changes into a daughter nucleus.'))}
      ${h('อ่านสัญลักษณ์นิวเคลียร์','Read a nuclear symbol')}
      ${p(`${n('A','Z','X')} โดย X คือสัญลักษณ์ธาตุ Z คือจำนวนโปรตอน A คือจำนวนโปรตอนรวมกับนิวตรอน และ N คือจำนวนนิวตรอน`,
           `${n('A','Z','X')} where X is the element symbol, Z is the proton number, A counts protons and neutrons, and N is the neutron number.`)}
      ${equation(1,'N = A − Z')}
      ${p('นิวเคลียสที่ไม่เสถียรอาจสลายได้เองพร้อมปล่อยอนุภาคหรือรังสี เรียกว่า <strong>กัมมันตภาพรังสี</strong> ความเสถียรขึ้นกับองค์ประกอบของนิวเคลียส รวมถึงสัดส่วนนิวตรอนต่อโปรตอน',
      'An unstable nucleus can decay spontaneously and emit particles or radiation. This is <strong>radioactivity</strong>. Stability depends on nuclear composition, including the neutron-to-proton ratio.')}
      ${noteCheck(t(`เปรียบเทียบ ${n(12,6,'C')} กับ ${n(14,6,'C')} ซึ่งมีเพียง C-14 ที่สลายตัว ทั้งคู่เป็นคาร์บอนได้อย่างไร?`,
      `Compare ${n(12,6,'C')} and ${n(14,6,'C')}. Only C-14 decays. Why are both carbon?`),
      use('(1)')+line('N = A − Z')+p('ทั้งคู่มี Z = 6 จึงเป็นคาร์บอน แต่มีนิวตรอน 6 และ 8 ตามลำดับ C-14 เป็นไอโซโทปกัมมันตรังสี ธาตุกัมมันตรังสี เช่น เรเดียม เป็นธาตุที่ทุกไอโซโทปไม่เสถียร',
      'Both have Z = 6, so they are carbon. Their neutron numbers are 6 and 8, respectively. C-14 is a radioactive isotope. A radioactive element, such as radium, has only unstable isotopes.'),19)}
    `],
    ['radiation', t('2. ใช้หลักฐานจำแนกชนิดรังสี','2. Identify radiation from evidence'), `
      ${figure('aksorn-penetration.png',900,348,t('รังสีแอลฟา บีตา และแกมมาผ่านกระดาษ อะลูมิเนียม และตะกั่วต่างกัน','Alpha, beta and gamma interact differently with paper, aluminium and lead'),
      t('วัสดุจากซ้ายไปขวาคือกระดาษ อะลูมิเนียม และตะกั่ว ภาพแสดงการทะลุผ่านในตัวอย่างหนึ่ง','The barriers from left to right are paper, aluminium and lead. The paths show penetration in one example.'),aksorn,t('อจท. รูป 3.11','Aksorn, Figure 3.11'),'penetration')}
      ${noteCheck(t('จากภาพ รังสีใดผ่านกระดาษได้ แต่ถูกแผ่นอะลูมิเนียมในภาพกั้น? ให้เหตุผลจากเส้นทางรังสี',
      'Which radiation passes through paper but is blocked by the aluminium sheet in the figure? Refer to its path.'),
      p('บีตา เส้นทางผ่านกระดาษและสิ้นสุดที่อะลูมิเนียม','Beta. Its path passes through paper and ends at the aluminium.'),17)}
      ${table([t('รังสี','Radiation'),t('ลักษณะและสัญลักษณ์','Nature and symbol'),t('ประจุและสมบัติ','Charge and behaviour')],[
        ['α',t(`นิวเคลียสฮีเลียม ${alpha}`,`Helium nucleus ${alpha}`),t('+2e · ทะลุผ่านต่ำ','+2e · low penetration')],
        ['β⁻',t(`อิเล็กตรอนที่ปล่อยจากการสลาย ${beta}`,`Electron emitted in decay ${beta}`),t('−e · ทะลุผ่านได้มากกว่าแอลฟาในภาพ','−e · more penetrating than alpha in the figure')],
        ['γ',t('โฟตอนพลังงานสูง','High-energy photon'),t('0 · ตะกั่วช่วยลดความเข้ม','0 · lead reduces its intensity')],
        ['β⁺',t(`โพซิตรอน ${positron}`,`Positron ${positron}`),t('+e · ใช้เลขล่าง +1 ในสมการ','+e · use +1 as the lower number in an equation')],
      ])}
      ${p('e ในคอลัมน์ประจุคือขนาดประจุพื้นฐาน ในสนามไฟฟ้า แอลฟาและบีตาลบเบนไปคนละขั้ว แกมมาไม่เบน การทะลุผ่านขึ้นกับพลังงานของรังสีและตัวกลาง',
      'In the charge column, e is the elementary charge. In an electric field alpha and beta-minus deflect towards opposite plates, and gamma does not deflect. Penetration depends on radiation energy and the material.')}
      ${noteCheck(t('อนุภาคใดเบนไปทางแผ่นบวกในบรรดา α, β⁻ และ γ? อธิบายโดยใช้ประจุ',
      'Of α, β⁻ and γ, which deflects towards a positive plate? Explain using charge.'),
      p('β⁻ มีประจุลบจึงถูกดึงเข้าหาแผ่นบวก','β⁻ has negative charge and is attracted to the positive plate.'),17)}
    `],
    ['equations', t('3. ดุลสมการและตามหานิวเคลียสลูก','3. Balance nuclear equations and identify the daughter'), `
      ${p('เลขบน A ใช้นับนิวคลีออน สำหรับนิวเคลียส เลขล่าง Z คือจำนวนโปรตอน ส่วนเลขล่างของอนุภาคที่ปล่อย เช่น −1 ของอิเล็กตรอน คือค่าประจุในหน่วย e สัญลักษณ์ ∑ หมายถึงผลรวมของทุกพจน์',
      'The upper number A counts nucleons. For a nucleus, Z is the proton number. For an emitted particle, the lower number gives its charge in units of e, such as −1 for an electron. The symbol ∑ means the sum over all terms.')}
      ${equation(2,aeq)}
      ${equation(3,zeq)}
      ${table([t('สิ่งที่ปล่อย','Emission'),t('เลขของนิวเคลียสลูก','Daughter numbers'),t('เหตุผล','Reason')],[
        ['α','A − 4, Z − 2',t('เสียโปรตอน 2 และนิวตรอน 2','Loses two protons and two neutrons')],
        ['β⁻','A, Z + 1',t('นิวตรอนหนึ่งตัวเปลี่ยนเป็นโปรตอน','One neutron changes into a proton')],
        ['β⁺','A, Z − 1',t('โปรตอนหนึ่งตัวเปลี่ยนเป็นนิวตรอน','One proton changes into a neutron')],
        ['γ','A, Z',t('นิวเคลียสลดระดับพลังงาน','The nucleus drops to a lower energy state')],
      ])}
      ${p('ในโจทย์ดุลระดับนี้เขียนบีตาแบบย่อได้ นิวทริโนหรือแอนตินิวทริโนในสมการเต็มมี A = 0 และประจุเป็นศูนย์ จึงไม่เปลี่ยนการดุลเลขทั้งสอง',
      'The abbreviated beta equations are sufficient for this bookkeeping. The neutrino or antineutrino in the full equation has A = 0 and zero charge, so it does not alter either sum.')}
      ${noteCheck(t(`เมื่อ ${na} เปลี่ยนเป็น ${mg} เลขบนและเลขล่างที่เหลือเป็นเท่าไร ตรงกับอนุภาคใด?`,
      `When ${na} changes to ${mg}, which upper and lower numbers remain to balance? What particle matches them?`),
      use('(2)–(3)')+line(aeq)+line('24 = 24 + 0')+line(zeq)+line('11 = 12 + (−1)')+line(`${na} → ${mg} + ${beta}`)+p('รังสีบีตาลบ','The emission is beta-minus.'),31)}
      ${p('ถ้ามีอนุภาคเข้าทำปฏิกิริยาทางซ้าย เช่น นิวตรอน ให้รวมเลขบนและล่างของอนุภาคนั้นด้วย แล้วดุลด้วยหลักเดิม',
      'If a particle such as a neutron enters on the left, include its upper and lower numbers in the same sums.')}
    `],
    ['half-life',t('4. อ่านการลดลงทีละครึ่งก่อนสร้างสูตร','4. Follow the halving pattern before using a formula'), `
      ${graphs(en)}
      ${noteCheck(t('ชี้ที่ 1, 2 และ 3 ครึ่งชีวิต ค่าบนกราฟคือส่วนที่เหลือเท่าไร? หลัง 3 ครึ่งชีวิต สลายไปเท่าไร?',
      'Point to 1, 2 and 3 half-lives. What fractions remain? What fraction has decayed after 3 half-lives?'),
      p('เหลือ 1/2, 1/4 และ 1/8 ตามลำดับ เมื่อถึง 3 ครึ่งชีวิต ส่วนที่สลายคือ 1 − 1/8 = 7/8','The fractions remaining are 1/2, 1/4 and 1/8. After 3 half-lives the decayed fraction is 1 − 1/8 = 7/8.'),19)}
      ${p('<strong>ครึ่งชีวิต</strong> คือเวลาที่จำนวนนิวเคลียสของไอโซโทปเดิมที่ยังไม่สลายลดลงเหลือครึ่งหนึ่ง การสลายของนิวเคลียสเดี่ยวเกิดแบบสุ่ม ครึ่งชีวิตอธิบายภาพรวมของนิวเคลียสจำนวนมาก',
      '<strong>Half-life</strong> is the time for the number of undecayed nuclei of the original isotope to halve. Individual decays are random. Half-life describes the behaviour of a large number of nuclei.')}
      ${p('ให้ t เป็นเวลาที่ผ่านไป T<sub>½</sub> เป็นครึ่งชีวิตในหน่วยเดียวกัน และ n เป็นจำนวนช่วงครึ่งชีวิต',
      'Let t be elapsed time, T<sub>½</sub> be the half-life in the same units, and n be the number of half-lives.')}
      ${equation(4,half)}
      ${p('มวลไอโซโทปเดิมลดแบบคูณ ½ ซ้ำทุกช่วง ให้ m<sub>0</sub> เป็นมวลตั้งต้น m<sub>t</sub> เป็นมวลที่ยังไม่สลาย และ f เป็นสัดส่วนที่เหลือ จึงได้',
      'The original isotope’s mass is multiplied by ½ at each interval. Let m<sub>0</sub> be its initial mass, m<sub>t</sub> its undecayed mass and f the fraction remaining. This gives')}
      ${equation(5,fraction)}
      ${p('ให้ m<sub>decay</sub> เป็นมวลของไอโซโทปเดิมส่วนที่สลายไป','Let m<sub>decay</sub> denote the mass of the original isotope that has decayed.')}
      ${equation(6,decayed)}
    `],
    ['applications',t('5. ปฏิกิริยานิวเคลียร์และการใช้ประโยชน์','5. Nuclear reactions and uses'), `
      ${p('ปฏิกิริยาเคมีทั่วไปเกี่ยวข้องกับการจัดเรียงอิเล็กตรอนและพันธะ ส่วนปฏิกิริยานิวเคลียร์เปลี่ยนองค์ประกอบหรือสถานะพลังงานของนิวเคลียส',
      'Ordinary chemical reactions involve electrons and bonds. Nuclear reactions change the composition or energy state of nuclei.')}
      ${table([t('ฟิชชัน','Fission'),t('ทั้งสองกระบวนการ','Both processes'),t('ฟิวชัน','Fusion')],[
        [t('นิวเคลียสหนักแตกเป็นนิวเคลียสที่เบากว่า','A heavy nucleus splits into lighter nuclei.'),t('เกี่ยวข้องกับการเปลี่ยนแปลงในนิวเคลียส และกรณีที่เรียนมีการปล่อยพลังงาน','Involve nuclear change and release energy in the cases studied.'),t('นิวเคลียสเบารวมกันเป็นนิวเคลียสที่หนักขึ้น','Light nuclei combine to form a heavier nucleus.')],
        [t('ใช้เป็นแหล่งพลังงานในโรงไฟฟ้านิวเคลียร์','Provides energy in nuclear power stations.'),t('เปรียบเทียบจากสิ่งที่เกิดกับนิวเคลียสตั้งต้น','Compare what happens to the starting nuclei.'),t('เป็นแหล่งพลังงานในดวงอาทิตย์','Provides the Sun’s energy.')],
      ])}
      ${noteCheck(t('วาดแผนภาพเวนน์สั้น ๆ ให้มีจุดร่วม 1 ข้อและความแตกต่างของแต่ละกระบวนการ',
      'Draw a short Venn diagram with one similarity and one distinct point for each process.'),
      p('จุดร่วมคือเกิดการเปลี่ยนในนิวเคลียสและปล่อยพลังงานในตัวอย่างที่เรียน ฟิชชันคือการแตก ฟิวชันคือการรวม',
      'Both involve nuclear change and release energy in the examples studied. Fission splits a nucleus. Fusion combines nuclei.'),28)}
      ${h('ประโยชน์และหลักป้องกัน','Uses and protection principles')}
      ${table([t('การใช้','Use'),t('สมบัติที่ใช้','Relevant property')],[
        [t('ติดตามสารในการแพทย์','Medical tracing'),t('เครื่องตรวจจับรังสีช่วยติดตามตำแหน่งของสารติดตาม','Emitted radiation can be detected to track the tracer’s location.')],
        [t('หาอายุซากสิ่งมีชีวิตด้วย C-14','C-14 dating of once-living materials'),t('สัดส่วน C-14 ลดลงตามเวลาหลังสิ่งมีชีวิตหยุดแลกเปลี่ยนคาร์บอน','The proportion of C-14 decreases after carbon exchange stops.')],
        [t('ตรวจชิ้นงานอุตสาหกรรม','Industrial inspection'),t('ความเข้มรังสีที่ทะลุผ่านเปลี่ยนตามวัสดุและความหนา','Transmitted radiation varies with material and thickness.')],
      ])}
      ${p('ผลของรังสีขึ้นกับชนิด ปริมาณ และทางรับสัมผัส หลักลดการรับรังสีจากภายนอกคือ ลดเวลา เพิ่มระยะห่าง และใช้กำบังที่เหมาะสม การป้องกันการปนเปื้อนมีความสำคัญเมื่อสารอาจเข้าสู่ร่างกาย',
      'Effects depend on the radiation type, dose and route of exposure. Reduce external exposure by limiting time, increasing distance and using suitable shielding. Prevent contamination when material could enter the body.')}
      ${noteCheck(t('สารติดตามทางการแพทย์ช่วยให้ตรวจตำแหน่งของสารได้อย่างไร?',
      'How does a medical tracer let us locate a substance?'),
      p('เครื่องตรวจจับรับสัญญาณรังสีที่สารติดตามแผ่ออกมา เพื่อระบุตำแหน่งของสาร','A detector measures radiation emitted by the tracer so its location can be inferred.'),16)}
    `],
    ['worked-decay',t('ตัวอย่างพาทำ · สมการนิวเคลียร์','Guided examples · Nuclear equations'), `
      ${worked(en,1,t('เติมอนุภาคที่เข้าปฏิกิริยา','Account for an incoming particle'),
        t(`เติมอนุภาค X ในสมการ ${n(27,13,'Al')} + ${alpha} → ${n(30,14,'Si')} + X แล้วตรวจทั้งสองข้าง`,
          `Identify X in ${n(27,13,'Al')} + ${alpha} → ${n(30,14,'Si')} + X and verify both sides.`),
        use('(2)–(3)')+line(aeq)+line('A<sub>X</sub> = 27 + 4 − 30 = 1')+line(zeq)+line('Z<sub>X</sub> = 13 + 2 − 14 = 1')+p(`X คือโปรตอน ${n(1,1,'H')} ผลรวมทั้งสองข้างเป็น A = 31 และ Z = 15`,`X is a proton ${n(1,1,'H')}. Both sides sum to A = 31 and Z = 15.`),42)}
      ${worked(en,2,t('ติดตามการสลายสองครั้ง','Follow two decays'),
        t(`${n(140,56,'Ba')} แผ่บีตาลบสองครั้งต่อเนื่อง จงเขียนไอโซโทปหลังแต่ละครั้งและหาผลรวม A + Z สุดท้าย (La มี Z = 57, Ce มี Z = 58)`,
          `${n(140,56,'Ba')} emits beta-minus twice in succession. Write both daughters and find the final A + Z (La has Z = 57, Ce has Z = 58).`),
        use('(2)–(3)')+line(aeq)+line(zeq)+line(`${n(140,56,'Ba')} → ${n(140,57,'La')} + ${beta}`)+line(`${n(140,57,'La')} → ${n(140,58,'Ce')} + ${beta}`)+line('A + Z = 140 + 58 = 198')+
        p('เลขบนคงเดิมทั้งสองขั้น ส่วนเลขล่างของนิวเคลียสลูกเพิ่มทีละ 1','A stays the same in both steps. The daughter Z increases by one each time.'),52)}
      <p class="source">${t('ทักษะอ้างอิง','Skill reference')} · <a href="${mytcas68}">A-Level 2568 Q31</a></p>
    `],
    ['worked-time',t('ตัวอย่างพาทำ · หาเวลาและครึ่งชีวิต','Guided examples · Time and half-life'), `
      ${worked(en,3,t('หาเวลาจากมวลที่เหลือ','Find the time from remaining mass'),
        t('I-131 มีครึ่งชีวิต 8 วัน ถ้าเริ่มจาก 12.0 mg ต้องใช้เวลากี่วันจึงจะเหลือ 3.0 mg?',
          'I-131 has a half-life of 8 days. Starting from 12.0 mg, how long until 3.0 mg remains?'),
        use('(5)')+line(fraction)+line('f = 3.0 mg / 12.0 mg = 1/4')+line('1/4 = (½)<sup>2</sup>')+use('(4)')+line(half)+line('t = nT<sub>½</sub>')+line(t('t = 2 × 8 วัน = 16 วัน','t = 2 × 8 days = 16 days')),45)}
      ${worked(en,4,t('หาเวลาต่อหนึ่งครึ่งชีวิตจากส่วนที่สลาย','Find half-life from the decayed fraction'),
        t('ไอโซโทปชนิดหนึ่งสลายไป 87.5% ใน 36 ชั่วโมง จงหาครึ่งชีวิต',
          'An isotope has decayed by 87.5% in 36 h. Find its half-life.'),
        use('(5)')+line(fraction)+line('f = 1 − 0.875 = 0.125')+line('0.125 = 1/8 = (½)<sup>3</sup>')+use('(4)')+line(half)+line('T<sub>½</sub> = t/n')+line('T<sub>½</sub> = 36 h / 3 = 12 h'),49)}
      <p class="source">${t('ทักษะอ้างอิง','Skill reference')} · <a href="${mytcas69}">A-Level 2569 Q3</a></p>
    `],
    ['worked-mixed',t('ตัวอย่างพาทำ · จากสารแม่ที่สลายสู่สารลูก','Guided example · From decayed parent to daughter'), `
      ${worked(en,5,t('กลับมาที่ Na-24 และ Mg-24','Return to Na-24 and Mg-24'),
        t('เริ่มจาก Na-24 16.0 mg โดยไม่มี Mg-24 ตอนต้น หลัง 30 ชั่วโมง มี Na-24 เหลือเท่าไร เกิด Mg-24 ประมาณกี่ mg และแผ่อนุภาคใด? กำหนดครึ่งชีวิต 15 ชั่วโมง ให้มวลต่อโมลของไอโซโทปทั้งคู่ประมาณ 24 g/mol',
          'Start with 16.0 mg of Na-24 and no Mg-24. After 30 h, how much Na-24 remains, approximately how much Mg-24 forms, and what particle is emitted? Use a 15 h half-life and approximate both molar masses as 24 g/mol.'),
        use('(2)–(3)')+line(aeq)+line(zeq)+line(`${na} → ${mg} + ${beta}`)+
        use('(4)')+line(half)+line('n = 30 h / 15 h = 2')+use('(5)')+line(fraction)+line('m<sub>t</sub> = 16.0 mg × (½)<sup>2</sup> = 4.0 mg')+
        use('(6)')+line(decayed)+line('m<sub>decay</sub> = 16.0 mg − 4.0 mg = 12.0 mg')+
        p('Na-24 ที่สลาย 1 นิวเคลียสให้ Mg-24 1 นิวเคลียส มวลต่อโมลที่โจทย์ให้มีค่าเท่ากันโดยประมาณ จึงเกิด Mg-24 ประมาณ 12.0 mg และอนุภาคที่ต้องเติมเพื่อดุลคือบีตาลบ',
          'Each decayed Na-24 nucleus gives one Mg-24 nucleus. Their given molar masses are approximately equal, so about 12.0 mg of Mg-24 forms. Beta-minus balances the equation.'),82)}
      <aside>${h('เลือกปริมาณก่อนแทนค่า','Choose the quantity before substituting')}
      ${p('โจทย์ถามสารแม่เหลือ ใช้สมการ (5) ถามสารแม่สลาย ใช้สมการ (6) ถามสารลูกที่เกิด ให้เริ่มจากจำนวนสารแม่ที่สลายและอ่านอัตราส่วนจากสมการนิวเคลียร์',
        'For parent remaining, use (5). For parent decayed, use (6). For daughter formed, start with the amount of parent that decayed and read the ratio from the nuclear equation.')}</aside>
    `],
  ];
  return sections.map(([key,title,body], i) => ({key,title,body,kind:i < 5 ? 'lesson' : 'examples'}));
}

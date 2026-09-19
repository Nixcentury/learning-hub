import assert from "node:assert/strict";
import test from "node:test";
import { hasAnswer, parseNumericAnswer as parse, normalizeQuestion, isCorrectAnswer, isStoredAnswer } from "../public/shared/quiz-question-model.js";
import { readQuizContent } from "../public/shared/quiz-content-adapter.js";
import { mathLayouts } from "../public/shared/quiz-math-layouts.js";

test("numeric and formula palettes are separate and science symbols are shared", () => {
  assert.equal(mathLayouts("en").length, 1);
  const all = JSON.stringify(mathLayouts("en", true));
  for (const key of ["Math", "Physics", "Chemistry", "alphabetic", "greek", "\\\\log", "\\\\int", "\\\\partial", "\\\\sum", "\\\\sigma", "rightleftharpoons"]) assert.ok(all.includes(key), key);
});

for (const [input, expected] of [
  ["0",0],["-2",-2],["−2",-2],[".5",.5],["1/2",.5],["-3/4",-.75],
  ["1/2+1/3",5/6],["\\frac{5}{6}",5/6],["\\dfrac{1}{2}+\\frac{1}{3}",5/6],
  ["\\frac{\\frac{1}{2}}{3}",1/6],["๕/๖",5/6],["1,234.5",1234.5],
  ["\\frac56",5/6],["\\frac{10}{12}",5/6],["\\sqrt4",2],["\\frac{50}6",50/6],
  ["1.2e-3",.0012],["2^3",8],["2^{3}",8],["\\sqrt{4}",2],
  ["\\left(2+3\\right)\\times 4",20],["-2^2",-4],["(-2)^2",4],
  ["2^{-3}",.125],["\\pi",Math.PI],["\\frac{1}{2}\\div 2",.25],
]) test(`numeric grammar: ${input}`, () => {
  const actual = parse(input);
  assert.notEqual(actual, null);
  assert.ok(Math.abs(actual - expected) <= Number.EPSILON * Math.max(1, Math.abs(expected)));
});

for (const input of [""," ",null,undefined,{},[],true,"-",".","5/","\\frac{5}{}",
  "1/0","\\frac{1}{0}","Infinity","NaN","1e999","1e-999","10^{-999}","\\frac{1e-300}{1e30}","0x10","50kg","5%",
  "x","x=2","1,2","1 2","alert(1)","\\unknown{2}","\\sqrt{-1}","(2+3", "2**3", "2".repeat(161)]) {
  test(`reject incomplete/unsupported numeric input: ${String(input)}`, () => assert.equal(parse(input), null));
}
const record = (extra={}) => ({id:"qa-number",type:"number",answer:"5/6",prompt:{th:"โจทย์",en:"Question"},solution:{th:"เฉลย",en:"Solution"},...extra});
test("zero is answered, blank is not", () => {assert.equal(hasAnswer("0"),true);assert.equal(hasAnswer(0),true);assert.equal(hasAnswer(" "),false);});
test("equivalent fractions, numeric evaluation and tolerance", () => {
  const {question,errors}=normalizeQuestion(record()); assert.deepEqual(errors,[]);
  assert.ok(isCorrectAnswer(question,"\\frac{10}{12}"));
  assert.ok(isCorrectAnswer(question,"1/2+1/3"));
  assert.ok(!isCorrectAnswer(question,"0.83"));
  assert.ok(!isCorrectAnswer(question,""));
  const tolerant=normalizeQuestion(record({answer:"0.8333333333333333",tolerance:"0.005"})).question;
  assert.ok(isCorrectAnswer(tolerant,"0.83"));assert.ok(!isCorrectAnswer(tolerant,"0.82"));
  assert.ok(isCorrectAnswer(normalizeQuestion(record({answer:"0"})).question,"0"));
  assert.ok(!isCorrectAnswer(normalizeQuestion(record({answer:"0"})).question," "));
});
test("invalid authoring fails early", () => {
  for(const extra of [{answer:"x"},{tolerance:-1},{tolerance:""},{type:"symbolic"},{id:"constructor"},{topicIds:"one"},{examIds:["bad id"]}]){
    assert.ok(normalizeQuestion(record(extra)).errors.length,JSON.stringify(extra));
  }
});
test("one canonical question can have several topic/exam IDs", () => {
  const {question}=normalizeQuestion(record({topicIds:["fractions","arithmetic","fractions"],examIds:["exam-a","exam-b"]}));
  assert.equal(question.id,"qa-number");assert.deepEqual(question.topicIds,["fractions","arithmetic"]);assert.deepEqual(question.examIds,["exam-a","exam-b"]);
});
test("partial numeric drafts are restorable but cannot grade correct", () => {
  const {question}=normalizeQuestion(record());
  assert.ok(isStoredAnswer(question,"\\frac{5}{}"));assert.ok(!isCorrectAnswer(question,"\\frac{5}{}"));
  assert.ok(!isStoredAnswer(question,{answer:5}));
});
test("MCQ behavior and missing type remain backward compatible",()=>{
  const {question,errors}=normalizeQuestion(record({type:undefined,answer:"b",choices:[{id:"a"},{id:"b"}]}));
  assert.deepEqual(errors,[]);assert.equal(question.type,"choice");assert.ok(isCorrectAnswer(question,"b"));assert.ok(!isCorrectAnswer(question,"B"));assert.ok(!isStoredAnswer(question,"0"));
});
test("HTML adapter preserves metadata and rejects duplicate question IDs",()=>{
  const leaf={dataset:{th:"เนื้อหา",en:"Content"},querySelector:()=>null};
  const element={dataset:{questionId:"fraction",questionType:"number",answer:"5/6",topicIds:"fractions arithmetic",examIds:"exam-a"},querySelector:()=>leaf,querySelectorAll:()=>[]};
  const root={dataset:{activityId:"numeric-demo",activityKind:"quiz"},querySelectorAll:()=>[element]};
  const result=readQuizContent(root);assert.deepEqual(result.errors,[]);assert.equal(result.questions[0].type,"number");assert.deepEqual(result.questions[0].topicIds,["fractions","arithmetic"]);
  root.querySelectorAll=()=>[element,element];assert.match(readQuizContent(root).errors.join(" "),/Duplicate/);
});

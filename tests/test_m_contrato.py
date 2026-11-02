"""Contrato entre as páxinas de ordenador e a versión móbil (/m/).

A versión móbil le as páxinas PC ao abrirse. Se alguén cambia as clases
(section.col, h2, p.et, a.l, .chips, dialog#buzon...), o móbil quedaría baleiro:
este test avisa antes de publicar.
Executar: python3 -m unittest discover -s tests -v
"""
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PC = {"portada": RAIZ / "index.html", "diego": RAIZ / "diego/index.html", "brais": RAIZ / "brais/index.html"}
MOBIL = [RAIZ / "m/index.html", RAIZ / "m/diego/index.html", RAIZ / "m/brais/index.html", RAIZ / "m/m.js", RAIZ / "m/m.css"]


class Estrutura(HTMLParser):
    """Conta, por cada section.col dentro de main, o h2 e as ligazóns que le o móbil."""

    def __init__(self):
        super().__init__()
        self.pila, self.seccions, self.actual, self.ids = [], [], None, set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cl = (a.get("class") or "").split()
        if a.get("id"):
            self.ids.add((tag, a["id"]))
        if tag == "section" and "col" in cl and "main" in self.pila:
            self.actual = {"h2": 0, "ligazons": 0, "sen_href": 0}
            self.seccions.append(self.actual)
        elif self.actual is not None:
            if tag == "h2":
                self.actual["h2"] += 1
            if tag == "a" and ({"l", "ch", "chip"} & set(cl)):
                self.actual["ligazons"] += 1
                if not a.get("href"):
                    self.actual["sen_href"] += 1
        if tag not in ("meta", "link", "input", "br", "img", "path", "circle", "rect", "ellipse"):
            self.pila.append(tag)

    def handle_endtag(self, tag):
        if tag in self.pila:
            while self.pila and self.pila.pop() != tag:
                pass
        if tag == "section":
            self.actual = None


def analizar(ruta):
    p = Estrutura()
    p.feed(ruta.read_text(encoding="utf-8"))
    return p


class Contrato(unittest.TestCase):
    def test_bloques_con_titulo_e_ligazons(self):
        for nome, ruta in PC.items():
            p = analizar(ruta)
            self.assertGreaterEqual(len(p.seccions), 3, f"{nome}: faltan section.col en main")
            for i, s in enumerate(p.seccions):
                self.assertEqual(s["h2"], 1, f"{nome}: o bloque {i} non ten un h2")
                self.assertGreater(s["ligazons"], 0, f"{nome}: o bloque {i} non ten a.l / a.ch / a.chip")
                self.assertEqual(s["sen_href"], 0, f"{nome}: ligazón sen href no bloque {i}")

    def test_buzons(self):
        for nome in ("diego", "brais"):
            p = analizar(PC[nome])
            self.assertIn(("dialog", "buzon"), p.ids, f"{nome}: falta dialog#buzon")
            texto = PC[nome].read_text(encoding="utf-8")
            for campo in ('name="nome"', 'name="contacto"', 'name="texto"', 'name="web"', 'class="resultado"'):
                self.assertIn(campo, texto, f"{nome}: o buzón perdeu {campo}")

    def test_ligazon_a_version_movil(self):
        for nome, destino in (("portada", "/m/?movil=1"), ("diego", "/m/diego/?movil=1"), ("brais", "/m/brais/?movil=1")):
            self.assertIn(f'href="{destino}"', PC[nome].read_text(encoding="utf-8"))

    def test_movil_sen_emojis_nin_blur(self):
        emoji = re.compile("[\U0001F300-\U0001FAFF☀-➿]")
        for ruta in MOBIL:
            t = ruta.read_text(encoding="utf-8")
            self.assertIsNone(emoji.search(t), f"{ruta.name}: ten emojis")
            self.assertIsNone(re.search(r"backdrop-filter\s*:", t), f"{ruta.name}: backdrop-filter vai lento no iPhone")
            self.assertNotIn("blur(", t, f"{ruta.name}: blur vai lento no iPhone")

    def test_paxinas_movil_apuntan_a_sua_fonte(self):
        for ruta, fonte, pc in ((MOBIL[0], "/index.html", "/?pc=1"), (MOBIL[1], "/diego/index.html", "/diego/?pc=1"),
                                (MOBIL[2], "/brais/index.html", "/brais/?pc=1")):
            t = ruta.read_text(encoding="utf-8")
            self.assertIn(f'data-fonte="{fonte}"', t)
            self.assertIn(f'href="{pc}"', t)
            self.assertIn('<meta name="viewport"', t)


if __name__ == "__main__":
    unittest.main()

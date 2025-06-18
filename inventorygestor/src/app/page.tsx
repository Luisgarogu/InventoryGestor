'use client';

import { useRef, useState } from 'react';
import { Search } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Home() {
  const [rows, setRows] = useState<string[][]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qty, setQty] = useState<number[]>([]);

  const afterLoadRows = (data: string[][]) => {
    setRows(data);
    setQty(Array(data.length - 1).fill(0));   // -1 porque la primera fila es cabecera
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    /* 1. Validar extensión ------------------------------------------------ */
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xls') && !name.endsWith('.xlsx')) {
      alert('Formato no soportado. Sube un .xls o .xlsx');
      return;
    }

    /* 2. Leer la primera hoja -------------------------------------------- */
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    /* 3. Limpiar filas vacías / trim ------------------------------------- */
    const trimmed = aoa
      .filter(r => r.some(c => c != null && String(c).trim() !== ''))
      .map(r => r.map(c => (c == null ? '' : String(c).trim())));

    /* 4. QUITAR filas-descuento (primeras 4 celdas = decimales 0<x<1) ---- */
    const isDecimal01 = (v: unknown) => {
      if (v == null || v === '') return false;           // vacío ⇒ no es %
      const str = String(v).replace(',', '.');           // admite coma o punto
      const n = parseFloat(str);
      return !Number.isNaN(n) && n > 0 && n < 1;
    };
    const clean = trimmed.filter(row => {
      // toma las primeras 4 celdas (rellena con '' si faltan)
      const first4 = [...row, '', '', '', ''].slice(0, 4);
      return !(first4.every(isDecimal01));   //  descarta si las 4 son decimales 0<x<1
    });

    /* 5. Actualizar estado ------------------------------------------------ */
    afterLoadRows(clean);
  };


  /* ---------- Exportar a Excel ---------- */
  const exportExcel = () => {
    if (!rows.length) {
      alert('No hay datos para exportar');
      return;
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, 'inventario.xlsx');
  };

  /* ---------- UI ---------- */
  return (
    <main className="min-h-screen flex flex-col items-center px-4 md:px-10 py-6 text-white bg-surface">
      <h1 className="text-[#f2b62a] font-bold text-5xl md:text-6xl text-center mb-6">
        Gestor de Inventarios
      </h1>
      <hr className="w-full max-w-5xl border-white/20 mb-8" />

      {/* Selector y botones */}
      <section className="w-full max-w-5xl flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0 mb-8">
        <p className="text-center md:text-left leading-tight">
          Seleccione el archivo del <br className="md:hidden" />
          inventario del día de hoy
        </p>

        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 w-full">
          <input
            id="file"
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="file"
            className="block md:inline-block border-2 border-primary rounded-md px-6 py-2 cursor-pointer text-primary text-sm font-medium text-center"
          >
            Seleccione el Archivo
          </label>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#f2b62a] text-black font-semibold px-6 py-2 rounded-full hover:opacity-90 transition"
          >
            Cargar Información
          </button>

          {rows.length > 0 && (
            <button
              onClick={exportExcel}
              className="bg-action text-white font-semibold px-4 py-2 rounded-full hover:opacity-90 transition"
            >
              Exportar Excel
            </button>
          )}
        </div>
      </section>

      <hr className="w-full max-w-5xl border-white/20 mb-8" />

      {/* Buscador (placeholder) */}
      <section className="w-full max-w-5xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="relative w-full md:max-w-md mx-auto md:mx-0">
          <input
            type="text"
            placeholder="Busque el producto que desea añadir al pedido"
            className="w-full pl-5 pr-12 py-3 rounded-full bg-transparent border-2 border-white/30 placeholder-white/60 focus:outline-none"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
        </div>

        <button className="bg-[#f2b62a] text-black font-semibold px-8 py-2 rounded-full hover:opacity-90 transition md:ml-6">
          ESTADO DEL PEDIDO
        </button>
      </section>

      {/* Tabla */}
      <div className="w-full max-w-9xl overflow-x-auto rounded-lg bg-white/5 p-4">
        {rows.length ? (
          <table className="min-w-[820px] w-full text-center border border-white/40 border-collapse">
            <thead className="text-xs uppercase tracking-wider">
              <tr>
                {rows[0].map((th, i) => (
                  <th
                    key={i}
                    className={`py-2 px-3 border border-white/40 ${i === 0
                      ? 'bg-action'
                      : i === rows[0].length - 1
                        ? 'bg-primary'
                        : i % 2
                          ? 'bg-credit'
                          : 'bg-cash'
                      }`}
                  >
                    {th}
                  </th>
                ))}
                <th className="bg-blue-300 text-black py-2 px-3">descuento</th>
                <th className="bg-blue-300 text-black py-2 px-3">descuento</th>
                <th className="bg-red-300 text-black py-2 px-3">descuento</th>

                {/* ─── nuevas cabeceras ─── */}
                <th className="bg-yellow-300 text-black py-2 px-3">CANTIDAD A<br />PEDIR</th>
                <th className="bg-yellow-300 text-black py-2 px-3">AÑADIR</th>
              </tr>
            </thead>

            <tbody>
              {rows.slice(1).map((r, rI) => (
                <tr key={rI}>
                  {r.map((cell, cI) => (
                    <td
                      key={cI}
                      className="py-2 px-3 whitespace-nowrap border border-white/40"
                    >
                      {cell}
                    </td>

                  ))}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min={0}
                      value={qty[rI] ?? 0}
                      onChange={e => {
                        const v = [...qty];
                        v[rI] = Number(e.target.value);
                        setQty(v);
                      }}
                      className="w-20 text-center rounded-md border border-[#b8c1ff] bg-white text-black shadow-sm"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => console.log(`Añadir ${qty[rI]} und de », r[0]`)}
                      className="h-9 w-9 flex items-center justify-center rounded-full bg-yellow-400 hover:bg-yellow-300 transition">
                      <span className="text-2xl leading-none text-black">+</span>
                    </button>
                  </td>
                </tr>

              ))}

            </tbody>
          </table>
        ) : (
          <p className="text-center py-6 text-sm text-white/60">
            Aún no se ha cargado ningún archivo.
          </p>
        )}
      </div>


      {/* Botones inferiores */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between gap-4 mt-8">
        <button className="bg-[#004aad] text-white font-semibold px-6 py-2 rounded-full hover:opacity-90 transition">
          EMPEZAR NUEVO PEDIDO
        </button>
        <button className="bg-[#cd3333] text-white font-semibold px-6 py-2 rounded-full hover:opacity-90 transition">
          CARGAR NUEVO CATALOGO
        </button>
      </div>
    </main>
  );
}

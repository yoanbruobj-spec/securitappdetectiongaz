import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { logoBlancBase64 } from '../utils/logoBlancBase64'

interface PortableInterventionData {
  intervention: any
  portables: any[]
  site: any
  client: any
}

// ============================================
// FONCTION UTILITAIRE - Vérifier si une valeur est remplie
// ============================================
function hasValue(val: any): boolean {
  if (val === null || val === undefined) return false
  if (typeof val === 'string') {
    const trimmed = val.trim()
    return trimmed !== '' && trimmed !== 'N/A' && trimmed !== '-'
  }
  if (typeof val === 'number') return true
  return true
}

// ============================================
// PALETTE DE COULEURS - STYLE OFFICIEL
// ============================================
const COLORS = {
  primary: [180, 28, 28] as [number, number, number],       // Rouge SÉCUR'IT foncé
  secondary: [30, 41, 59] as [number, number, number],      // Slate 800
  accent: [139, 92, 246] as [number, number, number],       // Violet (portables)
  accentDark: [109, 40, 217] as [number, number, number],   // Violet foncé
  success: [21, 128, 61] as [number, number, number],       // Vert foncé
  warning: [161, 98, 7] as [number, number, number],        // Jaune foncé
  danger: [185, 28, 28] as [number, number, number],        // Rouge foncé
  dark: [15, 23, 42] as [number, number, number],           // Presque noir
  gray: [71, 85, 105] as [number, number, number],          // Gris moyen
  lightGray: [241, 245, 249] as [number, number, number],   // Gris très clair
  white: [255, 255, 255] as [number, number, number],
  border: [203, 213, 225] as [number, number, number],      // Bordure grise
}

export async function generateInterventionPortablePDF(data: PortableInterventionData) {
  const { intervention, portables, site, client } = data

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  let yPos = margin

  // Formater la date
  const dateStr = intervention.date_intervention
    ? new Date(intervention.date_intervention).toLocaleDateString('fr-FR')
    : 'N/A'

  // Mapping des types d'intervention
  const typeMapping: Record<string, string> = {
    'maintenance_preventive': 'Maintenance Préventive',
    'maintenance_corrective': 'Maintenance Corrective',
    'verification_periodique': 'Vérification Périodique',
    'installation': 'Installation',
    'mise_en_service': 'Mise en Service',
    'reparation': 'Réparation',
    'depannage': 'Dépannage',
    'diagnostic': 'Diagnostic',
    'formation': 'Formation',
    'autre': 'Autre'
  }

  const typeIntervention = intervention.type
    ? (typeMapping[intervention.type] || intervention.type.replace(/_/g, ' '))
    : 'Intervention'

  // Structure pour le sommaire
  const sommaire: { titre: string; page: number }[] = []
  let currentPage = 1

  // ============================================
  // PAGE 1 - PAGE DE GARDE OFFICIELLE
  // ============================================

  // En-tête avec bandeau
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 50, 'F')

  // Logo
  try {
    doc.addImage(logoBlancBase64, 'PNG', (pageWidth - 80) / 2, 10, 80, 20)
  } catch {
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text("SÉCUR'IT", pageWidth / 2, 28, { align: 'center' })
  }

  // Sous-titre entreprise
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Détection Gaz & Sécurité Industrielle', pageWidth / 2, 42, { align: 'center' })

  // Coordonnées
  yPos = 60
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(8)
  doc.text('6 rue Georges BRASSENS, Zac des 4 saisons, 31140 Fonbeauzard', pageWidth / 2, yPos, { align: 'center' })
  doc.text('Tél: 06 13 84 53 98  •  Email: christophe.agnus@yahoo.fr', pageWidth / 2, yPos + 5, { align: 'center' })

  // Ligne séparatrice
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos + 12, pageWidth - margin, yPos + 12)

  // Titre du document
  yPos = 95
  doc.setFillColor(...COLORS.lightGray)
  doc.rect(margin, yPos - 8, pageWidth - 2 * margin, 30, 'F')
  doc.setDrawColor(...COLORS.accent)
  doc.setLineWidth(1)
  doc.rect(margin, yPos - 8, pageWidth - 2 * margin, 30, 'S')

  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RAPPORT D\'INTERVENTION', pageWidth / 2, yPos + 3, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.accent)
  doc.text('DÉTECTEURS PORTABLES', pageWidth / 2, yPos + 13, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.gray)
  doc.text(typeIntervention.toUpperCase(), pageWidth / 2, yPos + 20, { align: 'center' })

  // Tableau d'informations principales
  yPos = 140

  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMATIONS GÉNÉRALES', margin, yPos)
  doc.setDrawColor(...COLORS.accent)
  doc.setLineWidth(0.8)
  doc.line(margin, yPos + 2, margin + 55, yPos + 2)

  yPos += 10

  const infoTableData: string[][] = []
  if (hasValue(client?.nom)) infoTableData.push(['Client', client.nom])
  if (hasValue(site?.nom)) infoTableData.push(['Site', site.nom])
  const adresseStr = `${site?.adresse || ''}, ${site?.ville || ''}`.trim().replace(/^,|,$/g, '').trim()
  if (hasValue(adresseStr)) infoTableData.push(['Adresse', adresseStr])
  if (hasValue(dateStr) && dateStr !== 'N/A') infoTableData.push(['Date d\'intervention', dateStr])
  const horairesStr = `${intervention.heure_debut || ''} - ${intervention.heure_fin || ''}`.trim()
  if (hasValue(horairesStr) && horairesStr !== '-') infoTableData.push(['Horaires', horairesStr])
  if (hasValue(intervention.technicien)) infoTableData.push(['Technicien', intervention.technicien])
  if (hasValue(intervention.local)) infoTableData.push(['Local / Zone', intervention.local])
  if (hasValue(intervention.contact_site)) infoTableData.push(['Contact sur site', intervention.contact_site])

  autoTable(doc, {
    startY: yPos,
    body: infoTableData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: COLORS.border,
      lineWidth: 0.3,
    },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        fillColor: COLORS.lightGray,
        textColor: COLORS.secondary,
        cellWidth: 45
      },
      1: {
        textColor: COLORS.dark
      },
    },
    margin: { left: margin, right: margin },
  })

  // Numéro de rapport
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(8)
  doc.text(`Rapport N° ${intervention.id?.substring(0, 8).toUpperCase() || 'N/A'}`, margin, pageHeight - 25)
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, margin, pageHeight - 20)

  // ============================================
  // PAGE 2 - SOMMAIRE
  // ============================================

  doc.addPage()
  currentPage = 2

  drawOfficialHeader(doc, 'SOMMAIRE', COLORS.accent)
  yPos = 50

  const sommairePageRef = currentPage
  const sommaireYRef = yPos

  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  doc.text('(Sommaire généré automatiquement)', pageWidth / 2, yPos + 20, { align: 'center' })

  // ============================================
  // PAGE 3 - SYNTHÈSE / RÉCAPITULATIF
  // ============================================

  doc.addPage()
  currentPage = 3
  sommaire.push({ titre: '1. Synthèse de l\'intervention', page: currentPage })

  drawOfficialHeader(doc, 'SYNTHÈSE DE L\'INTERVENTION', COLORS.accent)
  yPos = 50

  yPos = drawOfficialSection(doc, '1.1 Résumé', yPos, COLORS.accent)

  // Compter les gaz
  let totalGaz = 0
  portables.forEach(p => {
    if (p.portables_gaz) totalGaz += p.portables_gaz.length
  })

  const resumeData: string[][] = [
    ['Type d\'intervention', typeIntervention],
    ['Date', dateStr],
    ['Nombre de détecteurs portables', `${portables.length}`],
    ['Nombre total de cellules gaz', `${totalGaz}`],
  ]

  autoTable(doc, {
    startY: yPos,
    body: resumeData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 4, lineColor: COLORS.border, lineWidth: 0.3 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 60 },
    },
    margin: { left: margin, right: margin },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Tableau récapitulatif des statuts
  yPos = drawOfficialSection(doc, '1.2 État des équipements', yPos, COLORS.accent)

  const statutsData: any[][] = []

  portables.forEach((portable, idx) => {
    if (portable.portables_gaz) {
      portable.portables_gaz.forEach((gaz: any) => {
        // Déterminer le statut global
        let statut = 'OK'
        if (gaz.calibration_statut === 'NOK' || gaz.etalonnage_statut === 'NOK') {
          statut = 'NOK'
        } else if (gaz.calibration_statut === 'À remplacer' || gaz.etalonnage_statut === 'À remplacer') {
          statut = 'À remplacer'
        }

        statutsData.push([
          `Portable ${idx + 1}`,
          `${portable.marque || ''} ${portable.modele || ''}`.trim() || 'N/A',
          gaz.gaz || 'N/A',
          statut,
        ])
      })
    }
  })

  if (statutsData.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Équipement', 'Modèle', 'Gaz', 'Statut']],
      body: statutsData,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: 'bold',
      },
      columnStyles: {
        3: { fontStyle: 'bold', halign: 'center' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const val = data.cell.raw as string
          if (val === 'OK') {
            data.cell.styles.textColor = COLORS.success
          } else if (val === 'NOK' || val === 'À remplacer') {
            data.cell.styles.textColor = COLORS.danger
          }
        }
      },
      margin: { left: margin, right: margin },
    })
    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // ============================================
  // PAGES DÉTAILLÉES PAR PORTABLE
  // ============================================

  for (let i = 0; i < portables.length; i++) {
    const portable = portables[i]

    doc.addPage()
    currentPage++
    const portableTitle = `${sommaire.length + 1}. Portable ${i + 1} - ${portable.marque || ''} ${portable.modele || ''}`.trim()
    sommaire.push({ titre: portableTitle, page: currentPage })

    drawOfficialHeader(doc, `PORTABLE ${i + 1} - ${portable.marque || ''} ${portable.modele || ''}`, COLORS.accent)
    yPos = 50

    // ============================================
    // INFORMATIONS DU PORTABLE
    // ============================================

    yPos = drawOfficialSection(doc, `${sommaire.length}.1 Identification de l'équipement`, yPos, COLORS.accent)

    const equipData: string[][] = []
    if (hasValue(portable.marque)) equipData.push(['Marque', portable.marque])
    if (hasValue(portable.modele)) equipData.push(['Modèle', portable.modele])
    if (hasValue(portable.numero_serie)) equipData.push(['Numéro de série', portable.numero_serie])
    if (hasValue(portable.etat_general)) equipData.push(['État général', portable.etat_general])

    if (equipData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        body: equipData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 4, lineColor: COLORS.border, lineWidth: 0.3 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 50 },
        },
        margin: { left: margin, right: margin },
      })
      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // ============================================
    // VÉRIFICATIONS FONCTIONNELLES
    // ============================================

    if (portable.portables_verifications && portable.portables_verifications[0]) {
      const verif = portable.portables_verifications[0]
      const hasVerif = verif.alarme_sonore !== undefined || verif.alarme_visuelle !== undefined || verif.alarme_vibrante !== undefined

      if (hasVerif) {
        yPos = checkPageBreak(doc, yPos, 50, currentPage, COLORS.accent, `PORTABLE ${i + 1} - SUITE`)
        yPos = drawOfficialSection(doc, `${sommaire.length}.2 Vérifications fonctionnelles`, yPos, COLORS.accent)

        const verifData: string[][] = []
        if (verif.alarme_sonore !== undefined) verifData.push(['Alarme sonore', verif.alarme_sonore ? 'OK' : 'NON'])
        if (verif.alarme_visuelle !== undefined) verifData.push(['Alarme visuelle', verif.alarme_visuelle ? 'OK' : 'NON'])
        if (verif.alarme_vibrante !== undefined) verifData.push(['Alarme vibrante', verif.alarme_vibrante ? 'OK' : 'NON'])

        autoTable(doc, {
          startY: yPos,
          body: verifData,
          theme: 'plain',
          styles: { fontSize: 9, cellPadding: 4, lineColor: COLORS.border, lineWidth: 0.3 },
          columnStyles: {
            0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 50 },
            1: { fontStyle: 'bold' }
          },
          didParseCell: function(data) {
            if (data.section === 'body' && data.column.index === 1) {
              const val = data.cell.raw as string
              if (val === 'OK') {
                data.cell.styles.textColor = COLORS.success
              } else {
                data.cell.styles.textColor = COLORS.danger
              }
            }
          },
          margin: { left: margin, right: margin },
        })
        yPos = (doc as any).lastAutoTable.finalY + 10
      }
    }

    // ============================================
    // CELLULES GAZ
    // ============================================

    if (portable.portables_gaz && portable.portables_gaz.length > 0) {
      yPos = checkPageBreak(doc, yPos, 60, currentPage, COLORS.accent, `PORTABLE ${i + 1} - GAZ`)
      yPos = drawOfficialSection(doc, `${sommaire.length}.3 Cellules de détection (${portable.portables_gaz.length})`, yPos, COLORS.accent)

      for (let j = 0; j < portable.portables_gaz.length; j++) {
        const gaz = portable.portables_gaz[j]

        yPos = checkPageBreak(doc, yPos, 120, currentPage, COLORS.accent, `PORTABLE ${i + 1} - GAZ (SUITE)`)

        // Titre de la cellule gaz
        doc.setFillColor(...COLORS.accent)
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
        doc.setTextColor(...COLORS.white)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(`CELLULE GAZ N°${j + 1} - ${gaz.gaz || 'N/A'}`, margin + 3, yPos + 5.5)
        yPos += 12

        // Informations de la cellule
        const gazInfoData: string[][] = []
        if (hasValue(gaz.gaz)) gazInfoData.push(['Type de gaz', gaz.gaz])
        if (hasValue(gaz.gamme_mesure)) gazInfoData.push(['Gamme de mesure', gaz.gamme_mesure])
        if (hasValue(gaz.date_remplacement)) {
          gazInfoData.push(['Date remplacement cellule', new Date(gaz.date_remplacement).toLocaleDateString('fr-FR')])
        }
        if (hasValue(gaz.date_prochain_remplacement)) {
          gazInfoData.push(['Prochain remplacement', new Date(gaz.date_prochain_remplacement).toLocaleDateString('fr-FR')])
        }

        if (gazInfoData.length > 0) {
          autoTable(doc, {
            startY: yPos,
            body: gazInfoData,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 3, lineColor: COLORS.border, lineWidth: 0.2 },
            columnStyles: {
              0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 50 },
            },
            margin: { left: margin, right: margin },
          })
          yPos = (doc as any).lastAutoTable.finalY + 8
        }

        // Calibration Zéro
        const hasCalibZero = hasValue(gaz.calibration_gaz_zero) || hasValue(gaz.calibration_valeur_avant) ||
                            hasValue(gaz.calibration_valeur_apres) || hasValue(gaz.calibration_statut)

        // Étalonnage Sensibilité
        const hasEtalSensi = hasValue(gaz.etalonnage_gaz) || hasValue(gaz.etalonnage_valeur_avant_reglage) ||
                            hasValue(gaz.etalonnage_valeur_apres_reglage) || hasValue(gaz.etalonnage_statut)

        if (hasCalibZero || hasEtalSensi) {
          // En-têtes
          if (hasCalibZero) {
            doc.setFillColor(...COLORS.secondary)
            doc.rect(margin, yPos, hasEtalSensi ? (pageWidth - 2 * margin) / 2 - 3 : pageWidth - 2 * margin, 6, 'F')
            doc.setTextColor(...COLORS.white)
            doc.setFontSize(8)
            doc.setFont('helvetica', 'bold')
            doc.text('CALIBRATION ZÉRO', margin + 3, yPos + 4)
          }

          if (hasEtalSensi) {
            doc.setFillColor(...COLORS.secondary)
            doc.rect(hasCalibZero ? pageWidth / 2 + 2 : margin, yPos, hasCalibZero ? (pageWidth - 2 * margin) / 2 - 3 : pageWidth - 2 * margin, 6, 'F')
            doc.setTextColor(...COLORS.white)
            doc.setFontSize(8)
            doc.setFont('helvetica', 'bold')
            doc.text('ÉTALONNAGE SENSIBILITÉ', hasCalibZero ? pageWidth / 2 + 5 : margin + 3, yPos + 4)
          }
          yPos += 8

          if (hasCalibZero) {
            const calibData: string[][] = []
            if (hasValue(gaz.calibration_gaz_zero)) calibData.push(['Gaz zéro', gaz.calibration_gaz_zero])
            if (hasValue(gaz.calibration_valeur_avant)) calibData.push(['Valeur avant', String(gaz.calibration_valeur_avant)])
            if (hasValue(gaz.calibration_valeur_apres)) calibData.push(['Valeur après', String(gaz.calibration_valeur_apres)])
            if (hasValue(gaz.calibration_statut)) calibData.push(['Statut', gaz.calibration_statut])

            if (calibData.length > 0) {
              const statutIdx = calibData.findIndex(row => row[0] === 'Statut')
              autoTable(doc, {
                startY: yPos,
                body: calibData,
                theme: 'plain',
                styles: { fontSize: 8, cellPadding: 2, lineColor: COLORS.border, lineWidth: 0.2 },
                columnStyles: {
                  0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 30 },
                },
                margin: { left: margin, right: hasEtalSensi ? pageWidth / 2 + 5 : margin },
                didParseCell: function(data) {
                  if (data.section === 'body' && statutIdx >= 0 && data.row.index === statutIdx && data.column.index === 1) {
                    const val = String(data.cell.raw)
                    if (val === 'OK') {
                      data.cell.styles.textColor = COLORS.success
                      data.cell.styles.fontStyle = 'bold'
                    } else if (val === 'NOK' || val === 'À remplacer') {
                      data.cell.styles.textColor = COLORS.danger
                      data.cell.styles.fontStyle = 'bold'
                    }
                  }
                },
              })
            }
          }

          if (hasEtalSensi) {
            const etalData: string[][] = []
            if (hasValue(gaz.etalonnage_gaz)) etalData.push(['Gaz étalon', gaz.etalonnage_gaz])
            if (hasValue(gaz.etalonnage_unite)) etalData.push(['Unité', gaz.etalonnage_unite])
            if (hasValue(gaz.etalonnage_valeur_avant_reglage)) etalData.push(['Avant réglage', String(gaz.etalonnage_valeur_avant_reglage)])
            if (hasValue(gaz.etalonnage_valeur_apres_reglage)) etalData.push(['Après réglage', String(gaz.etalonnage_valeur_apres_reglage)])
            if (hasValue(gaz.etalonnage_coefficient)) etalData.push(['Coefficient', String(gaz.etalonnage_coefficient)])
            if (hasValue(gaz.etalonnage_statut)) etalData.push(['Statut', gaz.etalonnage_statut])

            if (etalData.length > 0) {
              const statutIdx = etalData.findIndex(row => row[0] === 'Statut')
              autoTable(doc, {
                startY: yPos,
                body: etalData,
                theme: 'plain',
                styles: { fontSize: 8, cellPadding: 2, lineColor: COLORS.border, lineWidth: 0.2 },
                columnStyles: {
                  0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 30 },
                },
                margin: { left: hasCalibZero ? pageWidth / 2 + 5 : margin, right: margin },
                didParseCell: function(data) {
                  if (data.section === 'body' && statutIdx >= 0 && data.row.index === statutIdx && data.column.index === 1) {
                    const val = String(data.cell.raw)
                    if (val === 'OK') {
                      data.cell.styles.textColor = COLORS.success
                      data.cell.styles.fontStyle = 'bold'
                    } else if (val === 'NOK' || val === 'À remplacer') {
                      data.cell.styles.textColor = COLORS.danger
                      data.cell.styles.fontStyle = 'bold'
                    }
                  }
                },
              })
            }
          }

          yPos = (doc as any).lastAutoTable.finalY + 8
        }

        // Seuils d'alarme
        const hasSeuils = hasValue(gaz.seuil_1) || hasValue(gaz.seuil_2) || hasValue(gaz.seuil_3) ||
                         hasValue(gaz.vme) || hasValue(gaz.vle)

        if (hasSeuils) {
          doc.setFillColor(...COLORS.warning)
          doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F')
          doc.setTextColor(...COLORS.white)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text('SEUILS D\'ALARME', margin + 3, yPos + 4)
          yPos += 8

          const seuilsData: string[][] = []
          if (hasValue(gaz.seuil_1)) seuilsData.push(['Seuil 1', String(gaz.seuil_1)])
          if (hasValue(gaz.seuil_2)) seuilsData.push(['Seuil 2', String(gaz.seuil_2)])
          if (hasValue(gaz.seuil_3)) seuilsData.push(['Seuil 3', String(gaz.seuil_3)])
          if (hasValue(gaz.vme)) seuilsData.push(['VME', String(gaz.vme)])
          if (hasValue(gaz.vle)) seuilsData.push(['VLE', String(gaz.vle)])

          autoTable(doc, {
            startY: yPos,
            body: seuilsData,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 3, lineColor: COLORS.border, lineWidth: 0.2 },
            columnStyles: {
              0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 40 },
            },
            margin: { left: margin, right: margin },
          })
          yPos = (doc as any).lastAutoTable.finalY + 12
        } else {
          yPos += 5
        }
      }
    }

    // ============================================
    // PIÈCES REMPLACÉES
    // ============================================

    if (hasValue(portable.pieces_remplacees)) {
      yPos = checkPageBreak(doc, yPos, 40, currentPage, COLORS.accent, `PORTABLE ${i + 1} - OBSERVATIONS`)
      yPos = drawOfficialSection(doc, `${sommaire.length}.4 Pièces remplacées`, yPos, COLORS.accent)

      yPos = drawObsBlock(doc, 'PIÈCES REMPLACÉES', portable.pieces_remplacees, yPos, COLORS.warning)
    }
  }

  // ============================================
  // OBSERVATIONS GÉNÉRALES
  // ============================================

  if (hasValue(intervention.observations_generales) || hasValue(intervention.conclusion_generale)) {
    doc.addPage()
    currentPage++
    sommaire.push({ titre: `${sommaire.length + 1}. Observations et conclusion`, page: currentPage })

    drawOfficialHeader(doc, 'OBSERVATIONS ET CONCLUSION', COLORS.accent)
    yPos = 50

    if (hasValue(intervention.observations_generales)) {
      yPos = drawOfficialSection(doc, `${sommaire.length}.1 Observations générales`, yPos, COLORS.accent)
      yPos = drawObsBlock(doc, 'OBSERVATIONS', intervention.observations_generales, yPos, COLORS.secondary)
    }

    if (hasValue(intervention.conclusion_generale)) {
      yPos = checkPageBreak(doc, yPos, 40, currentPage, COLORS.accent, 'CONCLUSION')
      yPos = drawOfficialSection(doc, `${sommaire.length}.2 Conclusion`, yPos, COLORS.accent)
      yPos = drawObsBlock(doc, 'CONCLUSION', intervention.conclusion_generale, yPos, COLORS.success)
    }
  }

  // ============================================
  // REMPLIR LE SOMMAIRE (PAGE 2)
  // ============================================

  doc.setPage(sommairePageRef)
  yPos = sommaireYRef

  doc.setFillColor(...COLORS.lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, sommaire.length * 10 + 15, 'F')

  yPos += 8

  sommaire.forEach((item) => {
    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(item.titre, margin + 5, yPos)

    const titleWidth = doc.getTextWidth(item.titre)
    const pageNumWidth = doc.getTextWidth(String(item.page))
    const dotsStart = margin + 5 + titleWidth + 2
    const dotsEnd = pageWidth - margin - pageNumWidth - 10

    doc.setTextColor(...COLORS.gray)
    let dotX = dotsStart
    while (dotX < dotsEnd) {
      doc.text('.', dotX, yPos)
      dotX += 2
    }

    doc.setTextColor(...COLORS.accent)
    doc.setFont('helvetica', 'bold')
    doc.text(String(item.page), pageWidth - margin - 5, yPos, { align: 'right' })

    yPos += 10
  })

  // ============================================
  // NUMÉROTATION FINALE DES PAGES
  // ============================================

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawOfficialFooter(doc, i, totalPages)
  }

  // ============================================
  // SAUVEGARDE
  // ============================================

  const sanitizeFileName = (str: string) => {
    return str
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim()
  }

  const clientName = sanitizeFileName(client?.nom || 'Client')
  const siteName = sanitizeFileName(site?.nom || 'Site')
  const localName = sanitizeFileName(intervention.local || 'Local')
  const dateFormatted = dateStr.replace(/\//g, '-')

  const fileName = `Portable_${dateFormatted}_${clientName}_${siteName}_${localName}.pdf`
  doc.save(fileName)
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function drawOfficialHeader(doc: jsPDF, title: string, accentColor: [number, number, number]) {
  const pageWidth = doc.internal.pageSize.width
  const margin = 15

  // Bandeau supérieur
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 12, 'F')

  doc.setTextColor(...COLORS.white)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text("SÉCUR'IT", margin, 8)

  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth - margin, 8, { align: 'right' })

  // Titre de la section
  doc.setFillColor(...COLORS.lightGray)
  doc.rect(0, 12, pageWidth, 25, 'F')

  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, 28, { align: 'center' })

  // Ligne sous le titre
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(1)
  doc.line(margin, 37, pageWidth - margin, 37)
}

function drawOfficialFooter(doc: jsPDF, pageNum: number, totalPages?: number) {
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15

  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18)

  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('SÉCUR\'IT - 6 rue Georges BRASSENS, 31140 Fonbeauzard - Tél: 06 13 84 53 98', margin, pageHeight - 12)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  const pageText = totalPages ? `Page ${pageNum} / ${totalPages}` : `Page ${pageNum}`
  doc.text(pageText, pageWidth - margin, pageHeight - 12, { align: 'right' })
}

function drawOfficialSection(doc: jsPDF, title: string, yPos: number, color: [number, number, number]): number {
  const margin = 15

  doc.setTextColor(...COLORS.secondary)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin, yPos)

  doc.setDrawColor(...color)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos + 2, margin + doc.getTextWidth(title), yPos + 2)

  return yPos + 10
}

function drawObsBlock(doc: jsPDF, title: string, content: string, yPos: number, color: [number, number, number]): number {
  const pageWidth = doc.internal.pageSize.width
  const margin = 15

  const lines = doc.splitTextToSize(content, pageWidth - 2 * margin - 15)
  const blockHeight = Math.max(20, lines.length * 4.5 + 12)

  doc.setFillColor(...color)
  doc.rect(margin, yPos, 4, blockHeight, 'F')

  doc.setFillColor(...COLORS.lightGray)
  doc.rect(margin + 4, yPos, pageWidth - 2 * margin - 4, blockHeight, 'F')

  doc.setTextColor(...color)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin + 8, yPos + 6)

  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(lines, margin + 8, yPos + 12)

  return yPos + blockHeight + 6
}

function checkPageBreak(doc: jsPDF, yPos: number, spaceNeeded: number, currentPage: number, accentColor: [number, number, number], headerTitle: string): number {
  const pageHeight = doc.internal.pageSize.height
  if (yPos + spaceNeeded > pageHeight - 25) {
    doc.addPage()
    drawOfficialHeader(doc, headerTitle, accentColor)
    return 50
  }
  return yPos
}

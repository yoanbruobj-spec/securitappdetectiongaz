import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PortableInterventionData {
  intervention: any
  portables: any[]
  site: any
  client: any
}

export async function generateInterventionPortablePDF(data: PortableInterventionData) {
  const { intervention, portables, site, client } = data

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  let yPos = margin

  const primaryColor: [number, number, number] = [59, 130, 246]
  const darkColor: [number, number, number] = [15, 23, 42]

  doc.setFillColor(220, 38, 38)
  doc.rect(0, 0, pageWidth, 50, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(32)
  doc.setFont('helvetica', 'bold')
  doc.text('SECUR\'IT', pageWidth / 2, 25, { align: 'center' })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Detection Gaz - Expert en securite', pageWidth / 2, 38, { align: 'center' })

  yPos = 58
  doc.setFillColor(245, 245, 245)
  doc.rect(0, yPos, pageWidth, 28, 'F')

  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('6 rue Georges BRASSENS, Zac des 4 saisons, 31140 Fonbeauzard', pageWidth / 2, yPos + 8, { align: 'center' })
  doc.text('Telephone : 06 13 84 53 98', pageWidth / 2, yPos + 15, { align: 'center' })
  doc.text('E-mail : christophe.agnus@yahoo.fr', pageWidth / 2, yPos + 22, { align: 'center' })

  yPos = 100

  doc.setTextColor(...darkColor)
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.text('RAPPORT D\'INTERVENTION', pageWidth / 2, yPos, { align: 'center' })

  doc.setDrawColor(220, 38, 38)
  doc.setLineWidth(1.5)
  doc.line(pageWidth / 2 - 50, yPos + 4, pageWidth / 2 + 50, yPos + 4)

  yPos += 10
  doc.setFontSize(14)
  doc.setTextColor(139, 92, 246)
  doc.text('DÉTECTEURS PORTABLES', pageWidth / 2, yPos, { align: 'center' })

  yPos += 8
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  const typeIntervention = intervention.type?.replace(/_/g, ' ').toUpperCase() || 'INTERVENTION'
  doc.text(typeIntervention, pageWidth / 2, yPos, { align: 'center' })

  yPos += 20
  const boxStartY = yPos
  const boxHeight = 85

  doc.setDrawColor(220, 38, 38)
  doc.setLineWidth(1)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, boxHeight, 5, 5, 'FD')

  yPos += 12

  const colWidth = (pageWidth - 2 * margin - 20) / 2
  const leftX = margin + 10
  const rightX = margin + 10 + colWidth + 10

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('CLIENT', leftX, yPos)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(client?.nom || 'N/A', leftX, yPos + 6)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('SITE', rightX, yPos)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(site?.nom || 'N/A', rightX, yPos + 6)

  yPos += 20

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('ADRESSE', leftX, yPos)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const adresseComplete = `${site?.adresse || ''}, ${site?.ville || ''}`.trim()
  doc.text(adresseComplete !== ',' ? adresseComplete : 'N/A', leftX, yPos + 6)

  yPos += 20

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('DATE D\'INTERVENTION', leftX, yPos)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  const dateStr = intervention.date_intervention
    ? new Date(intervention.date_intervention).toLocaleDateString('fr-FR')
    : 'N/A'
  doc.text(dateStr, leftX, yPos + 6)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('TECHNICIEN', rightX, yPos)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(intervention.technicien || 'N/A', rightX, yPos + 6)

  doc.addPage()
  yPos = margin

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('DÉTAILS DES DÉTECTEURS PORTABLES', margin, yPos)
  yPos += 10

  for (let i = 0; i < portables.length; i++) {
    const portable = portables[i]

    if (yPos > pageHeight - 100) {
      doc.addPage()
      yPos = margin
    }

    doc.setFillColor(139, 92, 246)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`DÉTECTEUR PORTABLE #${i + 1}`, margin + 5, yPos + 7)
    yPos += 15

    doc.setFillColor(248, 250, 252)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F')

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.text('Marque:', margin + 5, yPos + 7)
    doc.setFont('helvetica', 'normal')
    doc.text(portable.marque || 'N/A', margin + 30, yPos + 7)

    doc.setFont('helvetica', 'bold')
    doc.text('Modèle:', margin + 5, yPos + 14)
    doc.setFont('helvetica', 'normal')
    doc.text(portable.modele || 'N/A', margin + 30, yPos + 14)

    doc.setFont('helvetica', 'bold')
    doc.text('N° série:', margin + 5, yPos + 21)
    doc.setFont('helvetica', 'normal')
    doc.text(portable.numero_serie || 'N/A', margin + 30, yPos + 21)

    doc.setFont('helvetica', 'bold')
    doc.text('État général:', pageWidth / 2 + 10, yPos + 7)
    doc.setFont('helvetica', 'normal')
    doc.text(portable.etat_general || 'N/A', pageWidth / 2 + 40, yPos + 7)

    yPos += 30

    if (portable.portables_verifications && portable.portables_verifications[0]) {
      const verif = portable.portables_verifications[0]
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(59, 130, 246)
      doc.text('Vérifications fonctionnelles:', margin + 5, yPos)
      yPos += 7

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(`✓ Alarme sonore: ${verif.alarme_sonore ? 'OK' : 'NON'}`, margin + 10, yPos)
      doc.text(`✓ Alarme visuelle: ${verif.alarme_visuelle ? 'OK' : 'NON'}`, margin + 60, yPos)
      doc.text(`✓ Alarme vibrante: ${verif.alarme_vibrante ? 'OK' : 'NON'}`, margin + 110, yPos)
      yPos += 10
    }

    if (portable.portables_gaz && portable.portables_gaz.length > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(59, 130, 246)
      doc.text('Gaz détectés:', margin + 5, yPos)
      yPos += 7

      for (const gaz of portable.portables_gaz) {
        if (yPos > pageHeight - 120) {
          doc.addPage()
          yPos = margin
        }

        doc.setFillColor(250, 250, 255)
        doc.setDrawColor(139, 92, 246)
        doc.setLineWidth(0.5)
        doc.rect(margin + 5, yPos, pageWidth - 2 * margin - 10, 115, 'FD')

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(139, 92, 246)
        doc.text(`Gaz: ${gaz.gaz || 'N/A'}`, margin + 8, yPos + 8)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(`Gamme de mesure: ${gaz.gamme_mesure || 'N/A'}`, margin + 8, yPos + 15)

        if (gaz.date_remplacement) {
          const dateRemp = new Date(gaz.date_remplacement).toLocaleDateString('fr-FR')
          doc.text(`Date remplacement cellule: ${dateRemp}`, margin + 8, yPos + 21)
        }

        if (gaz.date_prochain_remplacement) {
          const dateProchaineRemp = new Date(gaz.date_prochain_remplacement).toLocaleDateString('fr-FR')
          doc.text(`Prochain remplacement: ${dateProchaineRemp}`, margin + 8, yPos + 27)
        }

        yPos += 32

        doc.setDrawColor(200, 200, 200)
        doc.line(margin + 8, yPos, pageWidth - margin - 8, yPos)
        yPos += 5

        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(59, 130, 246)
        doc.text('CALIBRATION ZÉRO', margin + 8, yPos)
        yPos += 6

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)

        const leftCol = margin + 8
        const midCol = margin + 70
        const rightCol = pageWidth / 2 + 20

        doc.text(`Gaz zéro: ${gaz.calibration_gaz_zero || 'N/A'}`, leftCol, yPos)
        doc.text(`Avant: ${gaz.calibration_valeur_avant !== null && gaz.calibration_valeur_avant !== undefined ? gaz.calibration_valeur_avant : 'N/A'}`, midCol, yPos)
        doc.text(`Après: ${gaz.calibration_valeur_apres !== null && gaz.calibration_valeur_apres !== undefined ? gaz.calibration_valeur_apres : 'N/A'}`, rightCol, yPos)

        yPos += 6
        doc.setFont('helvetica', 'bold')
        doc.text('Statut: ', leftCol, yPos)
        doc.setFont('helvetica', 'normal')
        const calStatusColor = gaz.calibration_statut === 'OK' ? [34, 197, 94] : [239, 68, 68]
        doc.setTextColor(...(calStatusColor as [number, number, number]))
        doc.text(gaz.calibration_statut || 'N/A', leftCol + 15, yPos)
        doc.setTextColor(0, 0, 0)

        yPos += 8

        doc.setDrawColor(200, 200, 200)
        doc.line(margin + 8, yPos, pageWidth - margin - 8, yPos)
        yPos += 5

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(59, 130, 246)
        doc.text('ÉTALONNAGE SENSIBILITÉ', margin + 8, yPos)
        yPos += 6

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)

        doc.text(`Gaz étalon: ${gaz.etalonnage_gaz || 'N/A'}`, leftCol, yPos)
        doc.text(`Unité: ${gaz.etalonnage_unite || 'N/A'}`, midCol, yPos)
        doc.text(`Coef: ${gaz.etalonnage_coefficient !== null && gaz.etalonnage_coefficient !== undefined ? gaz.etalonnage_coefficient : 'N/A'}`, rightCol, yPos)

        yPos += 6
        doc.text(`Avant réglage: ${gaz.etalonnage_valeur_avant_reglage !== null && gaz.etalonnage_valeur_avant_reglage !== undefined ? gaz.etalonnage_valeur_avant_reglage : 'N/A'}`, leftCol, yPos)
        doc.text(`Après réglage: ${gaz.etalonnage_valeur_apres_reglage !== null && gaz.etalonnage_valeur_apres_reglage !== undefined ? gaz.etalonnage_valeur_apres_reglage : 'N/A'}`, midCol, yPos)

        yPos += 6
        doc.setFont('helvetica', 'bold')
        doc.text('Statut: ', leftCol, yPos)
        doc.setFont('helvetica', 'normal')
        const etalStatusColor = gaz.etalonnage_statut === 'OK' ? [34, 197, 94] : [239, 68, 68]
        doc.setTextColor(...(etalStatusColor as [number, number, number]))
        doc.text(gaz.etalonnage_statut || 'N/A', leftCol + 15, yPos)
        doc.setTextColor(0, 0, 0)

        yPos += 8

        doc.setDrawColor(200, 200, 200)
        doc.line(margin + 8, yPos, pageWidth - margin - 8, yPos)
        yPos += 5

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(59, 130, 246)
        doc.text('SEUILS D\'ALARME', margin + 8, yPos)
        yPos += 6

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)

        doc.text(`Seuil 1: ${gaz.seuil_1 || 'N/A'}`, leftCol, yPos)
        doc.text(`Seuil 2: ${gaz.seuil_2 || 'N/A'}`, midCol, yPos)
        doc.text(`Seuil 3: ${gaz.seuil_3 || 'N/A'}`, rightCol, yPos)

        yPos += 6
        doc.text(`VME: ${gaz.vme || 'N/A'}`, leftCol, yPos)
        doc.text(`VLE: ${gaz.vle || 'N/A'}`, midCol, yPos)

        yPos += 18
      }
    }

    if (portable.pieces_remplacees) {
      if (yPos > pageHeight - 30) {
        doc.addPage()
        yPos = margin
      }

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(59, 130, 246)
      doc.text('Pièces remplacées:', margin + 5, yPos)
      yPos += 7

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      const piecesLines = doc.splitTextToSize(portable.pieces_remplacees, pageWidth - 2 * margin - 10)
      doc.text(piecesLines, margin + 5, yPos)
      yPos += piecesLines.length * 5 + 5
    }

    yPos += 5
  }

  if (intervention.observations_generales || intervention.conclusion_generale) {
    if (yPos > pageHeight - 60) {
      doc.addPage()
      yPos = margin
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('OBSERVATIONS ET CONCLUSION', margin, yPos)
    yPos += 10

    if (intervention.observations_generales) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Observations générales:', margin, yPos)
      yPos += 7

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const obsLines = doc.splitTextToSize(intervention.observations_generales, pageWidth - 2 * margin)
      doc.text(obsLines, margin, yPos)
      yPos += obsLines.length * 5 + 5
    }

    if (intervention.conclusion_generale) {
      if (yPos > pageHeight - 40) {
        doc.addPage()
        yPos = margin
      }

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Conclusion:', margin, yPos)
      yPos += 7

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const concLines = doc.splitTextToSize(intervention.conclusion_generale, pageWidth - 2 * margin)
      doc.text(concLines, margin, yPos)
      yPos += concLines.length * 5 + 10
    }
  }

  if (yPos > pageHeight - 30) {
    doc.addPage()
    yPos = margin
  }

  yPos = pageHeight - 20
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(
    `Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )

  const fileName = `Rapport_Portable_${client?.nom || 'Intervention'}_${dateStr.replace(/\//g, '-')}.pdf`
  doc.save(fileName)
}
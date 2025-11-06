<!--
.. title: Zwölftonreihen-Tabellen mit Common Lisp, LilyPond und LaTeX
.. slug: twelve-tone-row-table-with-common-lisp-lilypond-and-latex
.. date: 2013-08-07
.. tags:
.. category: Code-Snippets
.. link:
.. description:
.. type: text
-->

Aus einer Zwölftonreihe lassen sich 48 Reihen ableiten: die Ursprungsreihe, die Umkehrung, der Krebs und die Krebs-Umkehrung in jeweils 12 Transpositionsmöglichkeiten. Hier zeige ich, wie man hübsche Tabellen dieser 48 Ableitungen erstellen kann. Hier ein Beispiel der Reihe von Arnold Schönbergs *Variationen für Orchester* op. 31.

<div style="text-align:center">
  <a href="/media/row_schoenberg.pdf">
    <img src="/images/row_schoenberg.jpg" />
  </a>
</div>

Im Folgenden wird eine alte Version beschrieben, welche LilyPond und LaTeX benötigt. Eine neuere Version, die ausschließlich LilyPond verwendet, wird auch [GitHub](https://github.com/fzalkow/12tone-table) gepflegt. Es ist auch eine ausführbare Datei für Mac OS X verfügbar, mit der keine Common Lisp Implementation benötigt wird.

Man benötigt eine Common Lisp Implementation (ich arbeite mit LispWorks), bei der ASDF verfügbar sein muss. Es klappt nur auf Plattformen mit Shell wie Max OSX oder Unix, da die Kommunikation mit dem Betriebssystem über asdf:run-shell-command realisiert wird.

Die Pfade zu LilyPond, pdflatex sowie die Zwölftonreihe können in den ersten Zeilen angegeben werden. Für die Notennamen in der Zwölftonreihe müssen die englischen Namen für die Stammtöne (c d e f g a b) verwendet werden und is bzw. es für Erhöhung oder Erniedrigung angehangen werden. (Das bedeutet z.B., dass ein es als ees notiert werden muss!)

Bei Fragen, Anmerkungen oder sonstwas: Ich freue mich über über [Kontakt](/de/about-me.html)!

```common-lisp
;;; -*- mode: Common-Lisp; Base: 10 ; Syntax: ANSI-Common-Lisp ; coding: utf-8 -*-
;;; make 12 tone row table pdf files with LilyPond and LaTeX
;;; This work is licensed under a Creative Commons Attribution 3.0 Unported License.
;;; Frank Zalkow, 2010-2013

;; adjust these paths to your needs
(defparameter *row* '(bes e ges ees f a d cis g gis b c))
(defparameter *lilypond* "/Applications/LilyPond/LilyPond.app")
(defparameter *pdflatex* "/usr/texbin/pdflatex")

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; ASDF
(require 'asdf)
(unless (find-package 'asdf)
  (error "ASDF is not installed!"))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; ARBITRARY NOTE NAMES TO NOTE NUMBERS
(defun name2number (note)
  (let* ((diatonic '(("c" 0) ("d" 2) ("e" 4) ("f" 5) ("g" 7) ("a" 9) ("b" 11)))
         (notestr (symbol-name note))
         (nr (cadr (nth
                    (position (subseq notestr 0 1) diatonic :test #'string-equal :key #'car)
                    diatonic))))
    (dotimes (i (/ (- (length notestr) 1) 2) nr)
      (let ((substr (subseq notestr (+ 1 (* 2 i)) (+ 3 (* 2 i)))))
        (setq nr (+ nr (cond ((string-equal substr "is") 1)
                             ((string-equal substr "es") -1)
                             (T (error (concatenate 'string note " is not a valid note name!"))))))))))

;; ROW MANIPULATIONS: transpositions, retrograde, inversion, retrograde-inversion
(defun transposition (row interval)
  (mapcar #'(lambda (n) (mod (+ n interval) 12)) row))

(defun retrograde (row)
  (reverse row))

(defun inversion (row &aux (first (car row)))
  (mapcar
   #'(lambda (n)
       (mod (+ (- first n) first) 12))
   row))

(defun retrograde-inversion (row)
  (retrograde (inversion row)))

;; GENERATING CODE FOR LILYBOOK
(defun generate-code (row-name &optional (stream T))
  (let ((row-nr (mapcar #'name2number row-name)))
    ; converting a list of note numbers into a lilypond string
    (labels ((row2str (row)
               (let ((notes (mapcar #'(lambda (n)
                                        (nth (position n row-nr) row-name))
                                    row)))
                 (string-downcase
                  (concatenate 'string
                               (symbol-name (car notes)) "'4 "
                               (format nil "~{~a' ~}" (cdr notes)))))))

      (format stream "\\documentclass[landscape]{article}~%\\usepackage{array}~%\\usepackage{geometry}~%\\geometry{a4paper,left=10mm,right=10mm, top=10mm, bottom=10mm} ~%~%\\begin{document}~%~%\\begin{center}~%\\thispagestyle{empty}~%~%\\Large \\textsc{Twelve-tone-row table}\\\\[2cm] \\normalsize~%~%\\newcolumntype{C}{>{\\centering\\arraybackslash} m{6cm}}~%\\newcolumntype{D}{>{\\centering\\arraybackslash} m{0.5cm}}~%\\begin{tabular}{|D|CCCC|}\\hline~% & prime & retrograde & inversion & retrograde-inversion\\\\ \\hline~%")
      (dotimes (transp 12)
        (format stream "~d & " (+ transp 1))
        (dolist (func '(append retrograde inversion retrograde-inversion))
          (format stream "\\begin{lilypond}[fragment,staffsize=12]~%")
          (format stream "#(set-accidental-style 'dodecaphonic)~%\\override Staff.TimeSignature #'stencil = ##f~%\\override Stem #'transparent = ##t~%\\cadenzaOn~%")
          (format stream (row2str (transposition (funcall func row-nr) transp)))
          (format stream "~%\\end{lilypond} ")
          (unless (eql func 'retrograde-inversion) (format stream " & ~%")))
        (format stream "\\\\ \\hline~%"))
      (format stream "\\end{tabular}~%\\end{center}~%\\end{document}"))))

;; ADDING A STRING TO AN ENVIRONMENT VARIABLE FOR DIFFERENT LISP IMPLEMENTATIONS
(defmacro add-env-path (pathname &optional (name "PATH"))
  (let ((env
         #+LISPWORKS `(lispworks:environment-variable ,name)
         #+CMU       `(cdr (assoc ,name ext:*environment-list* :test #'string=))
         #+Allegro   `(sys:getenv ,name)
         #+CLISP     `(ext:getenv ,name)
         #+ECL       `(si:getenv ,name)
         #+SBCL      `(sb-unix::posix-getenv ,name)
         ))
    `(if (and ,pathname (not (string= ,pathname "")))
         (setf ,env (concatenate 'string ,env ":" ,pathname))
       ,env)))

(defun double-tilde (str)
  (substitute "~" "~~" str))

;; EXECUTE SHELL COMMANDS AND CREATE PDF
(defun create-pdf (row)
  (let* ((tempdir (concatenate 'string "/tmp/twelve-tone-row-table-" (write-to-string (random 9999999999)) "/"))
         (lytex-file (merge-pathnames tempdir "myrowtable.lytex"))
         (tex-file (merge-pathnames tempdir "myrowtable.tex"))
         (pdf-file (merge-pathnames tempdir "myrowtable.pdf"))
         (lilybook (concatenate 'string *lilypond* "/Contents/Resources/bin/lilypond-book")))
    ; if pdflatex directory is not in path environment, add it
    (let* ((pdflatex-dir/ (directory-namestring *pdflatex*))
           (pdflatex-dir (subseq pdflatex-dir/ 0 (- (length pdflatex-dir/) 1))))
      (unless (search pdflatex-dir (add-env-path NIL))
        (add-env-path pdflatex-dir)))
    ; create files
    (ensure-directories-exist tempdir)
    (with-open-file (filestream
                     lytex-file
                     :direction :output
                     :if-exists :supersede
                     :if-does-not-exist :create)
      (generate-code row filestream))
    (unless (probe-file lytex-file) (error (concatenate 'string (namestring lytex-file) " could not be created!")))
    (format T "\; call lilypond-book - this can take awhile")
    (format T "~a"
            (nth-value 1 (asdf:run-shell-command
             (double-tilde (concatenate 'string lilybook " --output=" tempdir " --pdf " (namestring lytex-file))))))
    (unless (probe-file tex-file) (error (concatenate 'string (namestring tex-file) " could not be created!")))
    (format T "\; call pdflatex")
    (format T "~a"
            (nth-value 1 (asdf:run-shell-command
             (double-tilde (concatenate 'string "cd " tempdir " ; " *pdflatex* " -output-directory=" tempdir " " (namestring tex-file))))))
    (if (probe-file pdf-file)
        (format T "~a created!" (namestring pdf-file))
      (error (concatenate 'string (namestring pdf-file) " could not be created!")))
    (format T "\; open pdf")
    (asdf:run-shell-command
     (double-tilde (concatenate 'string "open " (namestring pdf-file))))))

(create-pdf *row*)
```

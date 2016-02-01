<?php

namespace JJB\FormUtilsBundle\Service;

use Symfony\Bundle\FrameworkBundle\Translation\Translator;
use Symfony\Component\Form\FormView;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Constraints;

class JSConstraintService
{
    /**
     * @var Translator
     */
    private $translator;


    public function __construct(Translator $translator)
    {
        $this->translator = $translator;
    }

    /**
     * Returns a constraints and corresponding error messages for each field formatted for the javascript validator.
     *
     * @param FormView $form
     * @param Constraint $constraint
     * @param null|string $domain
     * @return array
     */
    public function extractConstraints(FormView $form, Constraint $constraint, $domain = null)
    {
        $tests    = [];
        $messages = [];

        // Converts "\" to "/" and then gets basename of class (quick hack so we don't have to use Reflection)
        $constraintName = basename(str_replace('\\', '/', get_class($constraint)));
        $methodName     = 'constraint' . $constraintName;

        // Check to see if constraint type is supported
        if (method_exists($this, $methodName)) {
            switch ($constraintName) {
                case "Count":
                    list ($tests, $messages) = $this->{$methodName}($form, $constraint, $domain);
                    break;

                default:
                    list ($tests, $messages) = $this->{$methodName}($constraint, $domain);
                    break;
            }
        }

        return [$tests, $messages];
    }

    /**
     * @param Constraints\NotBlank $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintNotBlank(Constraints\NotBlank $constraint, $domain = null)
    {
        $tests    = ".+";
        $messages = $this->trans($constraint->message, [], $domain);

        return [$tests, $messages];
    }

    /**
     * @param Constraints\Luhn $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintLuhn(Constraints\Luhn $constraint, $domain = null)
    {
        $tests    = '__LUHN__';
        $messages = $this->trans($constraint->message, [], $domain);

        return [$tests, $messages];
    }

    /**
     * @param Constraints\Regex $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintRegex(Constraints\Regex $constraint, $domain = null)
    {
        $tests    = trim($constraint->pattern, '/');
        $messages = $this->trans($constraint->message, [], $domain);

        return [$tests, $messages];
    }

    /**
     * @param Constraints\Email $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintEmail(Constraints\Email $constraint, $domain = null)
    {
        $tests    = "^.+\@\S+\.\S+$";
        $messages = $this->trans($constraint->message, [], $domain);

        return [$tests, $messages];
    }

    /**
     * @param Constraints\Date $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintDate(Constraints\Date $constraint, $domain = null)
    {
        $tests    = '^[0-9]{4}-[0-9]{2}-[0-9]{2}$';
        $messages = $this->trans($constraint->message, [], $domain);

        return [$tests, $messages];
    }

    /**
     * @param Constraints\Time $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintTime(Constraints\Time $constraint, $domain = null)
    {
        $tests    = '^[0-9]{2}:[0-9]{2}(:[0-9]{2})?$';
        $messages = $this->trans($constraint->message, [], $domain);

        return [$tests, $messages];
    }

    /**
     * @param Constraints\DateTime $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintDateTime(Constraints\DateTime $constraint, $domain = null)
    {
        $tests    = '^[0-9]{4}-[0-9]{2}-[0-9]{2}\s[0-9]{2}\:[0-9]{2}\:[0-9]{2}$';
        $messages = $this->trans($constraint->message, [], $domain);

        return [$tests, $messages];
    }

    /**
     * @param Constraints\EqualTo $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintEqualTo(Constraints\EqualTo $constraint, $domain = null)
    {
        $tests    = '^' . $constraint->value . '$';
        $messages = preg_replace(
            '/{{\s?compared_value\s?}}/',
            $constraint->value,
            $this->trans($constraint->message, [], $domain)
        );

        return [$tests, $messages];
    }

    /**
     * @param Constraints\NotEqualTo $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintNotEqualTo(Constraints\NotEqualTo $constraint, $domain = null)
    {
        $tests    = '^(?!' . $constraint->value . ').+$';
        $messages = preg_replace(
            '/{{\s?compared_value\s?}}/',
            $constraint->value,
            $this->trans($constraint->message, [], $domain)
        );

        return [$tests, $messages];
    }

    /**
     * @param Constraints\GreaterThan $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintGreaterThan(Constraints\GreaterThan $constraint, $domain = null)
    {
        $tests    = '__({{value}} > ' . $constraint->value . ')__';
        $messages = preg_replace(
            '/{{\s?compared_value\s?}}/',
            $constraint->value,
            $this->trans($constraint->message, [], $domain)
        );

        return [$tests, $messages];
    }

    /**
     * @param Constraints\LessThan $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintLessThan(Constraints\LessThan $constraint, $domain = null)
    {
        $tests    = '__({{value}} < ' . $constraint->value . ')__';
        $messages = preg_replace(
            '/{{\s?compared_value\s?}}/',
            $constraint->value,
            $this->trans($constraint->message, [], $domain)
        );

        return [$tests, $messages];
    }

    /**
     * @param Constraints\GreaterThanOrEqual $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintGreaterThanOrEqual(Constraints\GreaterThanOrEqual $constraint, $domain = null)
    {
        $tests    = '__({{value}} >= ' . $constraint->value . ')__';
        $messages = preg_replace(
            '/{{\s?compared_value\s?}}/',
            $constraint->value,
            $this->trans($constraint->message, [], $domain)
        );

        return [$tests, $messages];
    }

    /**
     * @param Constraints\LessThanOrEqual $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintLessThanOrEqual(Constraints\LessThanOrEqual $constraint, $domain = null)
    {
        $tests    = '__({{value}} <= ' . $constraint->value . ')__';
        $messages = preg_replace(
            '/{{\s?compared_value\s?}}/',
            $constraint->value,
            $this->trans($constraint->message, [], $domain)
        );

        return [$tests, $messages];
    }

    /**
     * @param Constraints\Range $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintRange(Constraints\Range $constraint, $domain = null)
    {
        $tests[]    = '^[0-9]+$';
        $messages[] = $this->trans($constraint->invalidMessage, [], $domain);

        $tests[]    = '__({{value}} >= ' . $constraint->min . ')__';
        $msg        = $this->trans($constraint->minMessage, [], $domain, $constraint->min);
        $messages[] = preg_replace('/{{\s?limit\s?}}/', $constraint->min, $msg);

        $tests[]    = '__({{value}} <= ' . $constraint->max . ')__';
        $msg        = $this->trans($constraint->maxMessage, [], $domain, $constraint->max);
        $messages[] = preg_replace('/{{\s?limit\s?}}/', $constraint->max, $msg);

        return [$tests, $messages];
    }

    /**
     * @param Constraints\Ip $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintIp(Constraints\Ip $constraint, $domain = null)
    {
        $tests    = '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$';
        $messages = $this->trans($constraint->message, [], $domain);

        return [$tests, $messages];
    }

    /**
     * @param Constraints\Url $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintUrl(Constraints\Url $constraint, $domain = null)
    {
        $tests    = '^(https?:\/\/)([\d\w]+)\.?([\d\w\-_]+)?\.([\d\w\-_]+\.([a-z0-9]{2,6}))(.*)$';
        $messages = $this->trans($constraint->message, [], $domain);

        return [$tests, $messages];
    }

    /**
     * @param Constraints\Length $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintLength(Constraints\Length $constraint, $domain = null)
    {
        $tests    = [];
        $messages = [];

        if (
            $constraint->min > 0 && $constraint->max > 0 &&
            ($constraint->min === $constraint->max)
        ) {
            $tests[]    = '^.{' . $constraint->min . ',' . $constraint->max . '}$';
            $_msg       = $this->trans($constraint->exactMessage, [], $domain, $constraint->min);
            $messages[] = preg_replace('/{{\s?limit\s?}}/', $constraint->min, $_msg);
        } else {
            if ($constraint->min > 0) {
                $tests[]    = '.{' . $constraint->min . ',}';
                $_msg       = $this->trans($constraint->minMessage, [], $domain, $constraint->min);
                $messages[] = preg_replace('/{{\s?limit\s?}}/', $constraint->min, $_msg);
            }

            if ($constraint->max > 0) {
                $tests[]    = '^.{0,' . $constraint->max . '}$';
                $_msg       = $this->trans($constraint->maxMessage, [], $domain, $constraint->max);
                $messages[] = preg_replace('/{{\s?limit\s?}}/', $constraint->max, $_msg);
            }
        }

        return [$tests, $messages];
    }

    /**
     * @param FormView $form
     * @param Constraints\Count $constraint
     * @param null $domain
     * @return array
     */
    protected function constraintCount(FormView $form, Constraints\Count $constraint, $domain = null)
    {
        $tests    = [];
        $messages = [];
        $selector = $form->vars['id'];

        if (
            $constraint->min > 0 && $constraint->max > 0 &&
            ($constraint->min === $constraint->max)
        ) {
            $tests[]    = 'COUNT(#' . $selector . '|' . $constraint->min . '|' . $constraint->max . ')';
            $_msg       = $this->trans($constraint->exactMessage, [], $domain, $constraint->min);
            $messages[] = preg_replace('/{{\s?limit\s?}}/', $constraint->min, $_msg);
        } else {
            if ($constraint->min > 0) {
                $tests[]    = 'COUNT(#' . $selector . '|' . $constraint->min . '|0)';
                $_msg       = $this->trans($constraint->minMessage, [], $domain, $constraint->min);
                $messages[] = preg_replace('/{{\s?limit\s?}}/', $constraint->min, $_msg);
            }

            if ($constraint->max > 0) {
                $tests[]    = 'COUNT(#' . $selector . '|0|' . $constraint->max . ')';
                $_msg       = $this->trans($constraint->maxMessage, [], $domain, $constraint->max);
                $messages[] = preg_replace('/{{\s?limit\s?}}/', $constraint->max, $_msg);
            }
        }

        return [$tests, $messages];
    }

    /**
     * @param string $string
     * @param string array $params
     * @param string $domain
     * @param int $number
     * @return string
     */
    private function trans($string, array $params = [], $domain, $number = 1)
    {
        return $this->translator->transChoice($string, $number, $params, $domain);
    }
}